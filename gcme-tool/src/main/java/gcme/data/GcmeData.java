package gcme.data;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import gcme.model.DictEntry;
import gcme.model.Line;
import gcme.model.TagTableEntry;
import gcme.model.TextGroup;

/**
 * Reads and normalizes the raw GCME data found in a data directory.
 *
 * <p>The data is lines of tagged text organized in a hierarchy of groups. The hierarchy, the group
 * identifiers, and the group titles are described by {@code abbr2title.lut}. The mapping from group
 * identifiers to the {@code .cat} files holding the text is described by {@code abbr2file.txt}.
 * Dictionary definitions live in {@code .lem} files below the {@code texts} directory.
 *
 * <p>Data problems which the original data is known to contain, such as missing definitions and
 * duplicate dictionary entries, are reported as warnings on {@link System#err} instead of failing.
 */
public final class GcmeData {
    /** Dictionary files holding definitions, ordered so that later files win on conflict. */
    private static final List<String> DICTIONARY_FILES = List.of("texts/anon/ch/dict/ap-all.lem",
            "texts/gow/dict/gow-all.lem", "texts/ch/dict/ch-all.lem");

    /** Marks the start of the tagged lemmas an entry in a {@code .lem} file defines. */
    private static final String DEFINITION_KEY = "KEY:";

    /**
     * Replacements to try when a tagged lemma does not directly match a dictionary definition key.
     * The order is significant because the first replacement which yields a definition wins.
     */
    private static final Map<String, String> DEFINITION_KEY_PERMUTATIONS = permutations();

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern NON_DIGITS = Pattern.compile("\\D+");
    private static final Pattern PUNCTUATION = Pattern.compile("\\p{Punct}");
    private static final Pattern CONTAINS_WORD_CHARACTER = Pattern.compile(".*\\w.*");
    private static final Pattern LEADING_DIGITS = Pattern.compile("^(\\d+)");

    /**
     * Orders text files by directory and then by the number their file name starts with so that
     * generated output is deterministic and follows the order of the text.
     */
    private static final Comparator<Path> TEXT_FILE_ORDER =
            Comparator.comparing((Path path) -> String.valueOf(path.getParent()))
                    .thenComparingLong(GcmeData::leadingNumber).thenComparing(Path::toString);

    private final Path basePath;

    /**
     * @param basePath directory holding the raw data
     */
    public GcmeData(Path basePath) {
        this.basePath = Objects.requireNonNull(basePath, "basePath");
    }

    private static Map<String, String> permutations() {
        Map<String, String> permutations = new LinkedHashMap<>();

        // Inconsistency with numeral tagging. Mapping the underscore to a hash keeps the
        // distinction, so it is tried before falling back on the bare numeral entry.
        permutations.put("@num_", "@num#");
        permutations.put("@num_adj", "@num");
        permutations.put("@num_n", "@num");
        permutations.put("@num_n%pl", "@num");
        permutations.put("@num_n%gen", "@num");

        // Dictionary entries don't have the absolute form
        permutations.put("_abs", "");

        // Seems to be the same
        permutations.put("@pron_adj", "@gram_adj");

        return Collections.unmodifiableMap(permutations);
    }

    /**
     * Maps group identifiers to the text files containing their lines.
     *
     * <p>Each line of {@code abbr2file.txt} maps a group identifier to a glob pattern matching text
     * files relative to the {@code texts} directory. A group may be mapped by several lines and a
     * text file belongs to the 2-4 groups which contain it. For example:
     *
     * <pre>
     * Ch,ch/07/1/*-ch.cat
     * Ch,ch/07/2/*-ch.cat
     * Bo3.m4,ch/03/3/51-ch.cat
     * </pre>
     *
     * @return map of group identifier to text files in text order
     * @throws IOException if the mapping cannot be read or a pattern matches no files
     */
    public Map<String, List<Path>> loadTextMap() throws IOException {
        Path mapFile = basePath.resolve("abbr2file.txt");
        Path textsPath = basePath.resolve("texts");

        List<Path> textFiles;

        try (Stream<Path> files = Files.walk(textsPath)) {
            textFiles = files.filter(Files::isRegularFile).toList();
        }

        Map<String, List<Path>> result = new HashMap<>();

        for (String line : readLines(mapFile)) {
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }

            int comma = line.indexOf(',');

            if (comma == -1) {
                throw new IOException("Unable to parse: " + line);
            }

            String id = line.substring(0, comma);
            String glob = line.substring(comma + 1).trim();

            String pathGlob = textsPath.resolve(glob).toString();
            PathMatcher matcher = FileSystems.getDefault().getPathMatcher("glob:" + pathGlob);

            List<Path> matched =
                    textFiles.stream().filter(matcher::matches).sorted(TEXT_FILE_ORDER).toList();

            if (matched.isEmpty()) {
                throw new IOException(
                        "Pattern " + pathGlob + " did not match any files for " + id);
            }

            result.computeIfAbsent(id, unused -> new ArrayList<>()).addAll(matched);
        }

        return Map.copyOf(result);
    }

    /**
     * Loads the hierarchy of texts described by {@code abbr2title.lut}.
     *
     * <p>Each line of the file defines a group using a location in the tree, the group identifier, and
     * the group title. For example {@code 0.2.3.13-Bo3.pr7,Boece - Book III: Prose 7}. The first
     * component of the location is {@code 0} for Chaucer and {@code 1} for Gower. The parent of a
     * group is found by changing its right most non zero component to zero.
     *
     * @return the root of the hierarchy
     * @throws IOException if the structure cannot be read or a parent cannot be found
     */
    public TextGroup loadTextStructure() throws IOException {
        TextGroup root = new TextGroup("root", "Corpus");
        TextGroup chaucer = root.addChild("Ch", "Geoffrey Chaucer");
        TextGroup gower = root.addChild("Gow", "John Gower");

        // Location in the tree as it appears in the file -> group at that location
        Map<String, TextGroup> groups = new HashMap<>();

        for (String line : readLines(basePath.resolve("abbr2title.lut"))) {
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }

            int comma = line.indexOf(',');

            if (comma == -1) {
                throw new IOException("Unable to parse name: " + line);
            }

            int dash = line.indexOf('-');

            if (dash == -1) {
                throw new IOException("Unable to parse id: " + line);
            }

            String name = line.substring(comma + 1).trim();
            String id = line.substring(dash + 1, comma);
            String[] location = line.substring(0, dash).split("\\.");

            if (location.length != 4) {
                throw new IOException("Unable to parse structure: " + line);
            }

            TextGroup parent = findParent(location, chaucer, gower, groups, line);

            groups.put(String.join(".", location), parent.addChild(id, name));
        }

        return root;
    }

    private static TextGroup findParent(String[] location, TextGroup chaucer, TextGroup gower,
            Map<String, TextGroup> groups, String line) throws IOException {
        String[] parentLocation = location.clone();

        if (parentLocation[3].equals("0")) {
            if (parentLocation[2].equals("0")) {
                // A work of an author, so the parent is the author
                return switch (parentLocation[0]) {
                    case "0" -> chaucer;
                    case "1" -> gower;
                    default -> throw new IOException("Could not find author for: " + line);
                };
            }

            parentLocation[2] = "0";
        } else {
            parentLocation[3] = "0";
        }

        TextGroup parent = groups.get(String.join(".", parentLocation));

        if (parent == null && !parentLocation[2].equals("0")) {
            // Some groups skip a level of the hierarchy
            parentLocation[2] = "0";
            parent = groups.get(String.join(".", parentLocation));
        }

        if (parent == null) {
            throw new IOException("Could not find parent of: " + line);
        }

        return parent;
    }

    /**
     * Parses all lines of a text file.
     *
     * @param path text file to parse
     * @return the lines in the order they appear in the file
     * @throws IOException if the file cannot be read or holds a malformed line
     */
    public List<Line> parseText(Path path) throws IOException {
        List<Line> result = new ArrayList<>();

        for (String line : readLines(path)) {
            if (!line.isEmpty()) {
                result.add(parseLine(line));
            }
        }

        return result;
    }

    /**
     * Parses a line of tagged text such as
     * {@code 100-ch 1368 Thow{*thou@pron%nom*} rote{*rote@n4*} of{*of@prep*}}.
     *
     * <p>The first token is the identifier of the text, the second the line number, and the remaining
     * tokens are words with their tagged lemmas.
     *
     * @param line raw line of a text file
     * @return the parsed line
     * @throws IOException if the line is malformed
     */
    public Line parseLine(String line) throws IOException {
        String[] tokens = WHITESPACE.split(line.trim());

        if (tokens.length < 3) {
            throw new IOException("Malformed line: " + line);
        }

        String id = tokens[0];
        String rawNumber = tokens[1];
        int number = parseLineNumber(rawNumber, line);

        StringBuilder words = new StringBuilder();
        StringBuilder taggedLemmas = new StringBuilder();

        for (int i = 2; i < tokens.length; i++) {
            if (!words.isEmpty()) {
                words.append(' ');
                taggedLemmas.append(' ');
            }

            parseToken(tokens[i], words, taggedLemmas);
        }

        Line result = Line.of(id, number, rawNumber, words.toString(), taggedLemmas.toString());

        if (WHITESPACE.split(result.text()).length != WHITESPACE
                .split(result.taggedLemmaText()).length) {
            throw new IOException("Malformed line: " + line);
        }

        return result;
    }

    /**
     * Extracts the line number from the raw number by keeping only its digits. A raw number such as
     * {@code Rub} which has no digits gets the number {@code -1}.
     */
    private static int parseLineNumber(String rawNumber, String line) throws IOException {
        String digits = NON_DIGITS.matcher(rawNumber).replaceAll("");

        if (digits.isEmpty()) {
            return -1;
        }

        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            throw new IOException("Unable to parse line number: " + line, e);
        }
    }

    /**
     * Splits a token such as {@code rote{*rote@n4*}} into its word and its tagged lemma, appending
     * each to the given buffers.
     */
    private static void parseToken(String token, StringBuilder words, StringBuilder taggedLemmas)
            throws IOException {
        boolean inWord = true;

        for (int i = 0; i < token.length();) {
            char c = token.charAt(i);

            if (inWord) {
                if (c == '{' && hasChar(token, i + 1, '*')) {
                    inWord = false;
                    i += 2;
                } else {
                    words.append(c);
                    i++;
                }
            } else {
                if (c == '*' && hasChar(token, i + 1, '}')) {
                    i += 2;

                    if (i != token.length()) {
                        throw new IOException("Trailing characters after token: " + token);
                    }
                } else {
                    taggedLemmas.append(c);
                    i++;
                }
            }
        }
    }

    private static boolean hasChar(String s, int index, char c) throws IOException {
        if (index >= s.length()) {
            throw new IOException("Premature end of token looking for " + c);
        }

        return s.charAt(index) == c;
    }

    /**
     * Builds the dictionary of every tagged lemma occurring in the corpus.
     *
     * <p>Each entry holds the word forms which occur for the tagged lemma and its definition if one
     * could be found. Tagged lemmas without a definition are reported as warnings.
     *
     * @return map of tagged lemma to its entry
     * @throws IOException if the data cannot be read
     */
    public Map<String, DictEntry> loadDictionary() throws IOException {
        Map<String, String> definitions = new HashMap<>(loadDictionaryDefinitions());

        // Let a tagged lemma without extra tags stand in for a fully tagged one. Keys are sorted so
        // that the entry which wins does not depend on hash order.
        definitions.keySet().stream().sorted().toList()
                .forEach(key -> definitions.putIfAbsent(baseTaggedLemma(key), definitions.get(key)));

        Map<String, DictEntry> result = new LinkedHashMap<>();

        loadDictionary(loadTextStructure(), loadTextMap(), definitions, result);

        return result;
    }

    /**
     * Loads the dictionary definitions of tagged lemmas from the {@code .lem} files.
     *
     * @return map of tagged lemma to definition
     * @throws IOException if a dictionary file cannot be read
     */
    public Map<String, String> loadDictionaryDefinitions() throws IOException {
        Map<String, String> result = new HashMap<>();

        for (String file : DICTIONARY_FILES) {
            // Definitions of the same tagged lemma in a later file replace earlier ones
            result.putAll(loadDefinitions(basePath.resolve(file)));
        }

        return result;
    }

    /**
     * Loads the definitions of one {@code .lem} file. An entry is a definition followed by the tagged
     * lemmas it defines, wrapped over several lines and terminated by an empty line. For example:
     *
     * <pre>
     * Achitofel n. "Achitophel, King David's counselor (in the Bible)," proper n.;
     * not in MED. KEY: achitofel@
     * n#propn
     * </pre>
     *
     * <p>Several tagged lemmas may follow the key, separated by spaces.
     */
    private static Map<String, String> loadDefinitions(Path dictionaryFile) throws IOException {
        Map<String, String> result = new HashMap<>();

        for (String entry : unwrapLines(dictionaryFile)) {
            int i = entry.indexOf(DEFINITION_KEY);

            if (i == -1) {
                System.err.println("Warning: Could not find KEY:" + entry);
                continue;
            }

            String definition = entry.substring(0, i).trim();
            String[] taggedLemmas =
                    WHITESPACE.split(entry.substring(i + DEFINITION_KEY.length()).trim());

            for (String taggedLemma : taggedLemmas) {
                if (result.containsKey(taggedLemma)) {
                    System.err.println("Warning: Entry already exists: " + entry);

                    // Prefer OED definition
                    if (definition.contains("OED")) {
                        result.put(taggedLemma, definition);
                    }
                } else {
                    result.put(taggedLemma, definition);
                }
            }
        }

        return result;
    }

    /**
     * Undoes the line wrapping of a dictionary file. Entries are separated by empty lines and a
     * trailing period is dropped from every wrapped line.
     */
    private static List<String> unwrapLines(Path dictionaryFile) throws IOException {
        List<String> entries = new ArrayList<>();
        StringBuilder entry = new StringBuilder();

        try (BufferedReader in = Files.newBufferedReader(dictionaryFile, StandardCharsets.UTF_8)) {
            String line;

            while ((line = in.readLine()) != null) {
                if (line.endsWith(".")) {
                    line = line.substring(0, line.length() - 1);
                }

                if (line.isEmpty()) {
                    if (!entry.isEmpty()) {
                        entries.add(entry.toString());
                        entry.setLength(0);
                    }
                } else {
                    entry.append(line);
                }
            }
        }

        if (!entry.isEmpty()) {
            entries.add(entry.toString());
        }

        return entries;
    }

    /**
     * Walks the hierarchy and records the word forms and definition of every tagged lemma found in
     * the text of leaf groups.
     */
    private void loadDictionary(TextGroup group, Map<String, List<Path>> textMap,
            Map<String, String> definitions, Map<String, DictEntry> result) throws IOException {
        if (!group.isLeaf()) {
            for (TextGroup child : group.children()) {
                loadDictionary(child, textMap, definitions, result);
            }

            return;
        }

        List<Path> files = textMap.get(group.id());

        if (files == null) {
            throw new IOException("No text files for group: " + group.id());
        }

        for (Path file : files) {
            for (Line line : parseText(file)) {
                String[] words = WHITESPACE.split(line.text().toLowerCase());
                String[] taggedLemmas = WHITESPACE.split(line.taggedLemmaText());

                if (words.length != taggedLemmas.length) {
                    throw new IOException(
                            "Malformed line does not having matching words and tags: " + file + line);
                }

                for (int i = 0; i < words.length; i++) {
                    String word = words[i];
                    String taggedLemma = taggedLemmas[i];

                    // If the token is a word, punctuation is not part of the word form
                    if (CONTAINS_WORD_CHARACTER.matcher(word).matches()) {
                        word = PUNCTUATION.matcher(word).replaceAll("");
                    }

                    result.computeIfAbsent(taggedLemma,
                            lemma -> new DictEntry(lemma, findDefinition(lemma, definitions)))
                            .addWord(word);
                }
            }
        }
    }

    /**
     * Finds the definition of a tagged lemma, falling back on the definition of the tagged lemma
     * without extra tags and then on known tagging inconsistencies.
     *
     * @return the definition or {@code null} if none could be found
     */
    private static String findDefinition(String taggedLemma, Map<String, String> definitions) {
        String definition = definitions.get(taggedLemma);

        if (definition != null) {
            return definition;
        }

        definition = definitions.get(baseTaggedLemma(taggedLemma));

        if (definition != null) {
            return definition;
        }

        for (Map.Entry<String, String> permutation : DEFINITION_KEY_PERMUTATIONS.entrySet()) {
            definition = definitions
                    .get(taggedLemma.replace(permutation.getKey(), permutation.getValue()));

            if (definition != null) {
                return definition;
            }
        }

        System.err.println("Warning: No definition for " + taggedLemma);

        return null;
    }

    /**
     * Strips the extra tags of a tagged lemma, mapping {@code seien@v1%imp} to {@code seien@v1}.
     *
     * @param taggedLemma tagged lemma to strip
     * @return the tagged lemma without extra tags
     */
    public static String baseTaggedLemma(String taggedLemma) {
        String result = taggedLemma;

        int i = result.indexOf('#');

        if (i != -1) {
            result = result.substring(0, i);
        }

        i = result.indexOf('%');

        if (i != -1) {
            result = result.substring(0, i);
        }

        return result;
    }

    /**
     * Loads the part of speech tag table from {@code pos.txt}. Group headers start with {@code ##}
     * and are followed by their tags. For example:
     *
     * <pre>
     * ##Part of Speech pos
     * abbrev abbr
     * adj#interj adj as interjection
     * </pre>
     *
     * @return the rows of the tag table in file order
     * @throws IOException if the table cannot be read or holds a malformed line
     */
    public List<TagTableEntry> loadTagTable() throws IOException {
        List<TagTableEntry> result = new ArrayList<>();
        String group = "";

        try (BufferedReader in =
                Files.newBufferedReader(basePath.resolve("pos.txt"), StandardCharsets.UTF_8)) {
            String line;

            while ((line = in.readLine()) != null) {
                line = WHITESPACE.matcher(line.trim()).replaceAll(" ");

                if (line.startsWith("##")) {
                    int end = line.lastIndexOf(' ');

                    if (end == -1) {
                        throw new IOException("Malformed line: " + line);
                    }

                    group = line.substring(2, end).trim();
                } else {
                    int i = line.indexOf(' ');

                    if (i == -1) {
                        throw new IOException("Malformed line: " + line);
                    }

                    result.add(new TagTableEntry(group, line.substring(0, i),
                            line.substring(i).trim()));
                }
            }
        }

        return List.copyOf(result);
    }

    /**
     * Maps every group identifier of the hierarchy to its title.
     *
     * @return map of identifier to title in hierarchy order
     * @throws IOException if the structure cannot be read
     */
    public Map<String, String> loadGroupTitles() throws IOException {
        Map<String, String> result = new LinkedHashMap<>();

        collectGroupTitles(loadTextStructure(), result);

        return result;
    }

    private static void collectGroupTitles(TextGroup group, Map<String, String> result) {
        result.put(group.id(), group.name());

        group.children().forEach(child -> collectGroupTitles(child, result));
    }

    /** Reads all lines of a UTF-8 file, trimming each one. */
    private static List<String> readLines(Path path) throws IOException {
        return Files.readAllLines(path, StandardCharsets.UTF_8).stream().map(String::trim).toList();
    }

    /** Number a file name starts with, or {@link Long#MAX_VALUE} if it starts with no digits. */
    private static long leadingNumber(Path path) {
        Matcher matcher = LEADING_DIGITS.matcher(path.getFileName().toString());

        if (!matcher.find()) {
            return Long.MAX_VALUE;
        }

        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException e) {
            return Long.MAX_VALUE;
        }
    }
}
