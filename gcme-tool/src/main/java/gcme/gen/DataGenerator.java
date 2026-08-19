package gcme.gen;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import gcme.data.GcmeData;
import gcme.model.DictEntry;
import gcme.model.Line;
import gcme.model.TextGroup;

/**
 * Generates the files the application is deployed with.
 *
 * <p>For each search index a bulk ingest request for OpenSearch ({@code .ndjson}) and an array of the
 * same documents for the Ember UI ({@code .json}) are written. The UI additionally gets the text
 * chooser data, the tag table, and the map of group identifiers to titles.
 *
 * <p>Output is deterministic: documents and the values within them are ordered by text order for
 * lines and alphabetically for dictionary data.
 */
public final class DataGenerator {
    /** Base name of the files holding the documents of the {@code line} index. */
    public static final String LINE = "line";

    /** Base name of the files holding the documents of the {@code word_dict} index. */
    public static final String WORD_DICT = "word_dict";

    /** Base name of the files holding the documents of the {@code lemma_dict} index. */
    public static final String LEMMA_DICT = "lemma_dict";

    /** Base name of the files holding the documents of the {@code lemma_tag_dict} index. */
    public static final String LEMMA_TAG_DICT = "lemma_tag_dict";

    /** Name of the file holding the text chooser data. */
    public static final String TEXT_POWER_SELECT_FILE = "text-powersel.json";

    /** Name of the file holding the tag table. */
    public static final String TAG_TABLE_FILE = "tag-table.json";

    /** Name of the file holding the map of group identifier to title. */
    public static final String GROUP_TITLE_FILE = "group-title.json";

    /** Tagged lemma used by the data for words which have not been tagged. */
    private static final String NOT_CONCORDED = "not-concorded";

    private static final ObjectMapper MAPPER = JsonMapper.builder().build();

    private final GcmeData data;
    private final Path outputDirectory;

    /**
     * @param data the data to generate from
     * @param outputDirectory existing directory to write the generated files to
     */
    public DataGenerator(GcmeData data, Path outputDirectory) {
        this.data = Objects.requireNonNull(data, "data");
        this.outputDirectory = Objects.requireNonNull(outputDirectory, "outputDirectory");
    }

    /**
     * Generates every file the application needs.
     *
     * @throws IOException if the data cannot be read or the files cannot be written
     */
    public void generateAll() throws IOException {
        generateDictionaryData();
        generateLineData();
        generateTextPowerSelectData();
        generateTagTable();
        generateGroupTitleMap();
    }

    /**
     * Generates the documents of the {@code line} index in text order.
     *
     * @throws IOException if the data cannot be read or the files cannot be written
     */
    public void generateLineData() throws IOException {
        Map<String, List<Path>> textMap = data.loadTextMap();
        TextGroup root = data.loadTextStructure();

        try (BulkWriter out = BulkWriter.create(MAPPER, outputDirectory, LINE)) {
            writeLines(root, textMap, null, out);
        }
    }

    /**
     * Writes the lines of a group and its descendants, checking on the way that the text files of a
     * group are exactly the text files of its children.
     *
     * @param group group to write the lines of
     * @param textMap map of group identifier to text files
     * @param parentFiles files of the containing group which have not been accounted for yet, or
     *        {@code null} if the containing group has no files
     * @param out destination of the documents
     */
    private void writeLines(TextGroup group, Map<String, List<Path>> textMap, Set<Path> parentFiles,
            BulkWriter out) throws IOException {
        if (group.isLeaf()) {
            for (Path file : textFiles(textMap, group)) {
                for (Line line : data.parseText(file)) {
                    out.write(lineDocument(group, line));
                }

                accountFor(file, group, parentFiles);
            }

            return;
        }

        Set<Path> groupFiles = textMap.containsKey(group.id())
                ? new LinkedHashSet<>(textMap.get(group.id()))
                : null;

        if (groupFiles != null && parentFiles != null) {
            groupFiles.forEach(file -> accountFor(file, group, parentFiles));
        }

        for (TextGroup child : group.children()) {
            writeLines(child, textMap, groupFiles, out);
        }

        if (groupFiles != null && !groupFiles.isEmpty()) {
            System.err.println("Group consistency warning: " + group.id()
                    + " files not included in children:" + groupFiles);
        }
    }

    /** Removes a file from the files of the containing group, warning if it is not one of them. */
    private static void accountFor(Path file, TextGroup group, Set<Path> parentFiles) {
        if (parentFiles == null) {
            return;
        }

        if (!parentFiles.remove(file)) {
            System.err.println("Group consistency warning: " + group.parent().id()
                    + " does not contain file of child " + group.id() + " " + file);
        }
    }

    private static List<Path> textFiles(Map<String, List<Path>> textMap, TextGroup group)
            throws IOException {
        List<Path> files = textMap.get(group.id());

        if (files == null) {
            throw new IOException("No text files for group: " + group.id());
        }

        return files;
    }

    private static LineDocument lineDocument(TextGroup group, Line line) throws IOException {
        List<String> groups = group.path();

        if (groups.size() < 2 || groups.size() > 4) {
            throw new IOException("Unexpected group size: " + line);
        }

        return new LineDocument(line.id(), line.number(), line.rawNumber(), groups, line.text(),
                line.lemmaText(), line.taggedLemmaText());
    }

    /**
     * Generates the documents of the {@code word_dict}, {@code lemma_dict}, and
     * {@code lemma_tag_dict} indices.
     *
     * @throws IOException if the data cannot be read or the files cannot be written
     */
    public void generateDictionaryData() throws IOException {
        Map<String, DictEntry> dictionary = new TreeMap<>(data.loadDictionary());

        // Words which have not been tagged do not belong in a dictionary
        dictionary.remove(NOT_CONCORDED);

        Map<String, String> baseDefinitions = baseDefinitions(dictionary);

        writeWordDictionary(dictionary, baseDefinitions);
        writeLemmaDictionary(dictionary, baseDefinitions);
        writeLemmaTagDictionary(dictionary);
    }

    /**
     * Maps tagged lemmas without their extra tags to a definition.
     *
     * <p>Where several tagged lemmas share a base, the definition of the tagged lemma which is
     * already the base wins. Otherwise the first definition in alphabetical order of the tagged
     * lemmas sharing the base wins. A base which has no definition at all is mapped to {@code null}
     * so that the definitions of a document stay aligned with its tagged lemmas.
     */
    private static Map<String, String> baseDefinitions(Map<String, DictEntry> dictionary) {
        Map<String, String> result = new HashMap<>();

        dictionary.forEach((taggedLemma, entry) -> {
            if (entry.definition() != null
                    && taggedLemma.equals(GcmeData.baseTaggedLemma(taggedLemma))) {
                result.put(taggedLemma, entry.definition());
            }
        });

        // A mapping to null counts as absent for putIfAbsent, so a definition still wins over it
        dictionary.forEach((taggedLemma, entry) -> result
                .putIfAbsent(GcmeData.baseTaggedLemma(taggedLemma), entry.definition()));

        return result;
    }

    private void writeWordDictionary(Map<String, DictEntry> dictionary,
            Map<String, String> baseDefinitions) throws IOException {
        Map<String, List<DictEntry>> byWord = new TreeMap<>();

        dictionary.values().forEach(entry -> entry.words()
                .forEach(word -> byWord.computeIfAbsent(word, unused -> new ArrayList<>()).add(entry)));

        try (BulkWriter out = BulkWriter.create(MAPPER, outputDirectory, WORD_DICT)) {
            for (Map.Entry<String, List<DictEntry>> entry : byWord.entrySet()) {
                List<String> lemmaTags = baseTaggedLemmas(entry.getValue());

                out.write(new WordDocument(entry.getKey(), lemmaTags,
                        definitions(lemmaTags, baseDefinitions)));
            }
        }
    }

    private void writeLemmaDictionary(Map<String, DictEntry> dictionary,
            Map<String, String> baseDefinitions) throws IOException {
        Map<String, List<DictEntry>> byLemma = new TreeMap<>();

        dictionary.values().forEach(entry -> byLemma
                .computeIfAbsent(entry.lemma(), unused -> new ArrayList<>()).add(entry));

        try (BulkWriter out = BulkWriter.create(MAPPER, outputDirectory, LEMMA_DICT)) {
            for (Map.Entry<String, List<DictEntry>> entry : byLemma.entrySet()) {
                List<String> words = entry.getValue().stream().flatMap(e -> e.words().stream())
                        .distinct().sorted().toList();
                List<String> lemmaTags = baseTaggedLemmas(entry.getValue());

                out.write(new LemmaDocument(words, entry.getKey(), lemmaTags,
                        definitions(lemmaTags, baseDefinitions)));
            }
        }
    }

    private void writeLemmaTagDictionary(Map<String, DictEntry> dictionary) throws IOException {
        try (BulkWriter out = BulkWriter.create(MAPPER, outputDirectory, LEMMA_TAG_DICT)) {
            for (DictEntry entry : dictionary.values()) {
                out.write(new LemmaTagDocument(entry.taggedLemma(),
                        entry.words().stream().sorted().toList(), entry.definition()));
            }
        }
    }

    /** Tagged lemmas of the given entries without their extra tags, sorted and without duplicates. */
    private static List<String> baseTaggedLemmas(List<DictEntry> entries) {
        return entries.stream().map(DictEntry::taggedLemma).map(GcmeData::baseTaggedLemma).distinct()
                .sorted().toList();
    }

    /** Definitions of the given tagged lemmas, with a {@code null} where there is no definition. */
    private static List<String> definitions(List<String> lemmaTags,
            Map<String, String> baseDefinitions) {
        return lemmaTags.stream().map(baseDefinitions::get).toList();
    }

    /**
     * Generates the text chooser data of the Ember UI.
     *
     * @throws IOException if the data cannot be read or the file cannot be written
     */
    public void generateTextPowerSelectData() throws IOException {
        PowerSelectOption root = powerSelectOption(data.loadTextStructure());

        writeJson(outputDirectory.resolve(TEXT_POWER_SELECT_FILE), root.options());
    }

    private static PowerSelectOption powerSelectOption(TextGroup group) {
        // A text without children directly below an author, such as Gower / Praise of Peace, becomes
        // a group holding itself as its only option so the chooser shows it like the other texts.
        boolean groupOfItself = group.isLeaf() && group.depth() == 2;

        if (group.isLeaf() && !groupOfItself) {
            return PowerSelectOption.option(group.id(), group.name());
        }

        List<PowerSelectOption> options = new ArrayList<>();

        if (group.parent() != null) {
            options.add(PowerSelectOption.option(group.id(), group.name()));
        }

        group.children().forEach(child -> options.add(powerSelectOption(child)));

        return PowerSelectOption.group(group.name(), options);
    }

    /**
     * Generates the part of speech tag table of the Ember UI.
     *
     * @throws IOException if the data cannot be read or the file cannot be written
     */
    public void generateTagTable() throws IOException {
        writeJson(outputDirectory.resolve(TAG_TABLE_FILE), data.loadTagTable());
    }

    /**
     * Generates the map of group identifier to title used by the Ember UI.
     *
     * @throws IOException if the data cannot be read or the file cannot be written
     */
    public void generateGroupTitleMap() throws IOException {
        writeJson(outputDirectory.resolve(GROUP_TITLE_FILE), data.loadGroupTitles());
    }

    private static void writeJson(Path path, Object value) throws IOException {
        try (Writer out = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            MAPPER.writeValue(out, value);
        }
    }
}
