package gcme.data;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.json.JSONObject;

import gcme.model.DictEntry;
import gcme.model.Line;
import gcme.model.TextGroup;

public class GcmeData {
    private final Path base_path;

    public GcmeData(Path path) {
        this.base_path = path;
    }

    // Map identifiers to the actual files containing the text

    public Map<String, List<Path>> loadTextMap() throws IOException {
        Map<String, List<Path>> result = new HashMap<>();

        // Maps text identifiers to glob patterns for matching text files.
        //
        // Example:
        // Ch,ch/07/1/*-ch.cat
        // Ch,ch/07/2/*-ch.cat
        // Bo3.m4,ch/03/3/51-ch.cat

        Path map_file = base_path.resolve("abbr2file.txt");
        List<Path> text_files = Files.walk(base_path.resolve("texts")).collect(Collectors.toList());

        try (BufferedReader input = Files.newBufferedReader(map_file, StandardCharsets.UTF_8)) {
            String line;

            while ((line = input.readLine()) != null) {
                line = line.trim();

                if (line.startsWith("#")) {
                    continue;
                }

                int glob_offset = line.indexOf(',');

                if (glob_offset == -1) {
                    throw new IOException("Unable to parse: " + line);
                }

                String glob = line.substring(glob_offset + 1).trim();
                String id = line.substring(0, glob_offset);

                String path_glob = base_path.resolve("texts").resolve(glob).toString();
                PathMatcher matcher = FileSystems.getDefault().getPathMatcher("glob:" + path_glob);

                List<Path> matched = result.get(id);

                if (matched == null) {
                    matched = new ArrayList<>();
                }

                List<Path> more = text_files.stream().filter(f -> matcher.matches(f)).collect(Collectors.toList());

                if (more.size() == 0) {
                    throw new IOException("Pattern " + path_glob + " did not match any files for " + id);
                }

                matched.addAll(more);

                result.put(id, matched);
            }
        }

        return result;
    }

    /**
     * Load structure of texts described in abbr2name.lut.
     * 
     * 
     * @return TextGroup
     * @throws IOException
     */
    public TextGroup loadTextStructure() throws IOException {
        TextGroup result = new TextGroup(null, "root", "Corpus");

        Path struct_file = base_path.resolve("abbr2title.lut");

        // Each line defines a text which is a node in the tree using a bizarre syntax
        //
        // Example:
        // 0.2.3.13-Bo3.pr7,Boece - Book III: Prose 7
        //
        // The first part gives a location in the tree
        // 0 indicates Chuacer and 1 Gower.
        // To find parent change right-most non-zero number to zero.

        TextGroup chaucer = new TextGroup(result, "Ch", "Geoffrey Chaucer");
        TextGroup gower = new TextGroup(result, "Gow", "John Gower");

        // Map structure string to its TextGroup
        Map<String, TextGroup> struct_map = new HashMap<>();

        try (BufferedReader input = Files.newBufferedReader(struct_file, StandardCharsets.UTF_8)) {
            String line;

            while ((line = input.readLine()) != null) {
                line = line.trim();

                if (line.startsWith("#")) {
                    continue;
                }

                int name_offset = line.indexOf(',');

                if (name_offset == -1) {
                    throw new IOException("Unable to parse name: " + line);
                }

                String name = line.substring(name_offset + 1).trim();

                int id_offset = line.indexOf('-');

                if (id_offset == -1) {
                    throw new IOException("Unable to parse id: " + line);
                }

                String id = line.substring(id_offset + 1, name_offset);
                String[] struct = line.substring(0, id_offset).split("\\.");

                if (struct.length != 4) {
                    throw new IOException("Unable to parse structure: " + line);
                }

                // Insert into correct place in tree based on struct

                String[] parent_struct = new String[4];

                parent_struct[0] = struct[0];
                parent_struct[1] = struct[1];
                parent_struct[2] = struct[2];
                parent_struct[3] = struct[3];

                TextGroup parent = null;

                if (parent_struct[3].equals("0")) {
                    if (parent_struct[2].equals("0")) {
                        if (parent_struct[0].equals("0")) {
                            parent = chaucer;
                        } else if (parent_struct[0].equals("1")) {
                            parent = gower;
                        } else {
                            throw new IOException("Could not find author for: " + line);
                        }
                    } else {
                        parent_struct[2] = "0";
                    }
                } else {
                    parent_struct[3] = "0";
                }

                if (parent == null) {
                    parent = struct_map.get(String.join(".", parent_struct));

                    if (parent == null && !parent_struct[2].equals("0")) {
                        parent_struct[2] = "0";
                        parent = struct_map.get(String.join(".", parent_struct));
                    }
                }

                if (parent == null) {
                    throw new IOException("Could not find parent of: " + line);
                }

                TextGroup group = new TextGroup(parent, id, name);

                struct_map.put(String.join(".", struct), group);
            }
        }

        return result;

    }

    public List<Line> parseText(Path path) throws IOException {
        List<Line> result = new ArrayList<>();

        try (BufferedReader input = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;

            while ((line = input.readLine()) != null) {
                line = line.trim();

                if (!line.isEmpty()) {
                    result.add(parseLine(line));
                }
            }
        }

        return result;
    }

    // Example:
    // 100-ch 1368 Thow{*thou@pron%nom*} rote{*rote@n4*} of{*of@prep*}
    public Line parseLine(String line) throws IOException {
        String[] tokens = line.trim().split("\\s+");
        StringBuilder words = new StringBuilder();
        StringBuilder tagged_lemmas = new StringBuilder();

        if (tokens.length < 3) {
            throw new IOException("Malformed line: " + line);
        }

        String id = tokens[0];
        String raw_number = tokens[1];
        int number;

        try {
            String s = raw_number.replaceAll("\\D+", "");

            if (s.isEmpty()) {
                number = -1;
            } else {
                number = Integer.parseInt(s);
            }
        } catch (NumberFormatException e) {
            throw new IOException("Unable to parse line number: " + line);
        }

        for (int i = 2; i < tokens.length; i++) {
            if (words.length() > 0) {
                words.append(' ');
                tagged_lemmas.append(' ');
            }

            parseToken(tokens[i], words, tagged_lemmas);
        }

        Line result = new Line(id, number, raw_number, words.toString(), tagged_lemmas.toString());

        return result;
    }

    private boolean hasChar(String s, int index, char c) throws IOException {
        if (index >= s.length()) {
            throw new IOException("Premataure end of token looking for " + c);
        }

        return s.charAt(index) == c;
    }

    private void parseToken(String token, StringBuilder words, StringBuilder tagged_lemmas) throws IOException {
        boolean in_word = true;

        for (int i = 0; i < token.length();) {
            char c = token.charAt(i);

            if (in_word) {
                if (c == '{' && hasChar(token, i + 1, '*')) {
                    in_word = false;
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
                    tagged_lemmas.append(c);
                    i++;
                }
            }
        }
    }

    // Write out in bulk ingest form documents for the line index
    public void generateElasticsearchBulkLineIngest(Path output) throws IOException {
        Map<String, List<Path>> map = loadTextMap();
        TextGroup root = loadTextStructure();

        try (BufferedWriter out = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
            generateElasticsearchBulkLineIngest(root, map, out);
        }
    }

    private JSONObject generateElasticsearchDocument(TextGroup group, Line line) {
        JSONObject doc = new JSONObject();

        doc.put("id", line.getId());
        doc.put("number", line.getNumber());
        doc.put("raw_number", line.getRawNumber());
        doc.put("words", line.getWords());
        doc.put("tagged_lemmas", line.getTaggedLemmas());

        List<String> groups = new ArrayList<>();

        // Add all except root group
        while (group.getParent() != null) {
            groups.add(group.getId());
            group = group.getParent();
        }

        doc.put("group", groups);

        return doc;
    }

    private void generateElasticsearchBulkLineIngest(TextGroup group, Map<String, List<Path>> map, BufferedWriter out)
            throws IOException {
        String action = "{ \"index\" : { } }";

        List<TextGroup> children = group.getChildren();

        if (children == null) {
            for (Path file : map.get(group.getId())) {
                for (Line line : parseText(file)) {
                    JSONObject source = generateElasticsearchDocument(group, line);

                    out.write(action + "\n");
                    out.write(source.toString() + "\n");
                }
            }
        } else {
            for (TextGroup child : children) {
                generateElasticsearchBulkLineIngest(child, map, out);
            }
        }
    }

    public List<DictEntry> generateDictionary() throws IOException {
        List<DictEntry> result = new ArrayList<>();

        Map<String, List<Path>> group_text_map = loadTextMap();
        TextGroup root = loadTextStructure();

        // tagged_lemma -> entry
        Map<String, DictEntry> tagged_lemma_map = new HashMap<>();

        generateDictionary(root, group_text_map, tagged_lemma_map);

        return result;
    }

    public Map<String, String> loadDictionaryDefinitions() throws IOException {
        Map<String, String> result = new HashMap<>();

        String[] dicts = new String[] { 
            "texts/ch/dict/ch-all.lem",
            "texts/gow/dict/gow-all.lem",
            "texts/anon/ch/dict/ap-all.lem"
        };
        
        for (String s: dicts) {
            Map<String, String> defs = load_dictionary_definitions(base_path.resolve(s));
            
            
            
            result.putAll(defs);
        }

        return result;
    }

    // Example: 
    // aforn adv.      "before, previously," s.v. afore adv., prep., and conj. OED.    KEY: aforn@adv
    // Achitofel n.    "Achitophel, King David's counselor (in the Bible)," proper n.; not in MED.     KEY: achitofel@
    // n#propn
    // 
    // Note the line wrapping. Empty lines separate entries.
    // May be multiple tagged lemmas separated by spaces after key

    private Map<String, String> load_dictionary_definitions(Path dict_lem_file) throws IOException {
        Map<String, String> result = new HashMap<>();

        // First undo the line wrapping and then parse the lines
        
        List<String> lines = new ArrayList<>();
        
        try (BufferedReader in = Files.newBufferedReader(dict_lem_file, StandardCharsets.UTF_8)) {
            String line;
            
            StringBuilder real_line = new StringBuilder();

            while ((line = in.readLine()) != null) {
                line = line.trim();
                
                if (line.isEmpty()) {
                    if (real_line.length() > 0) {
                        lines.add(real_line.toString());
                        real_line.setLength(0);
                    }
                } else {
                    real_line.append(line);
                }
            }
            
            if (real_line.length() > 0) {
                lines.add(real_line.toString());
            }
        }
        
        // Now parse unwrapped lines
        
        final String key = "KEY:";

        for (String line: lines) {
            int i = line.indexOf(key);
            
            if (i == -1) {
                //throw new IOException("Malformed entry: " + dict_lem_file + " " + line);
                System.err.println("Warning: Could not find KEY:" + line);
                continue;
            }
                
            String def = line.substring(0, i).trim();
            String[] tagged_lemmas = line.substring(i + key.length()).trim().split("\\s+");
                
            for (String tagged_lemma: tagged_lemmas) {
                if (result.containsKey(tagged_lemma)) {
                    //throw new IOException("Entry already exists: " + line);
                    System.err.println("Warning: Entry already exists: " + line);
                }
                
                result.put(tagged_lemma, def);
            }
        }
        
        return result;
    }

    private void generateDictionary(TextGroup group, Map<String, List<Path>> group_text_map,
            Map<String, DictEntry> tagged_lemma_map) throws IOException {
        List<TextGroup> children = group.getChildren();

        if (children == null) {
            for (Path file : group_text_map.get(group.getId())) {
                for (Line line : parseText(file)) {
                    // Must remove punctuaion
                    String[] words = line.getWords().replaceAll("\\\\p{Punct}", "").split("\\s+");
                    String[] tagged_lemmas = line.getTaggedLemmas().split("\\s+");

                    if (words.length != tagged_lemmas.length) {
                        throw new IOException("Malformed line: " + line);
                    }

                    for (int i = 0; i < words.length; i++) {
                        String word = words[i];
                        String tagged_lemma = tagged_lemmas[i];

                        DictEntry entry = tagged_lemma_map.get(tagged_lemma);

                        if (entry == null) {
                            entry = new DictEntry(tagged_lemma, null);
                            tagged_lemma_map.put(tagged_lemma, entry);
                        }

                        if (!entry.getWords().contains(word)) {
                            entry.getWords().add(word);
                        }
                    }
                }
            }
        } else {
            for (TextGroup child : children) {
                generateDictionary(group, group_text_map, tagged_lemma_map);
            }
        }

    }
}
