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

        try (BufferedWriter out = Files.newBufferedWriter(output)) {
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
        
        Map<String, List<Path>> text_map = loadTextMap();
        TextGroup root = loadTextStructure();
        
        // word form -> lemma
        Map<String,String> word_map = new HashMap<>();
        
        generateDictionary(root, text_map, result);
        
        
        return result;
    }

    private void generateDictionary(TextGroup group, Map<String, List<Path>> map, List<DictEntry> result) throws IOException {
        List<TextGroup> children = group.getChildren();

        if (children == null) {
            for (Path file : map.get(group.getId())) {
                for (Line line : parseText(file)) {
                    
                }
            }
        } else {
            for (TextGroup child : children) {
                generateDictionary(group, map, result);
            }
        }
        
    }
}
