package gcme.data;

import java.io.BufferedReader;
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
                    }  else {
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
                
                struct_map.put(String.join(".",  struct), group);
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

    // 100-ch 1368 Thow{*thou@pron%nom*} rote{*rote@n4*} of{*of@prep*} false{*fals@adj*} lovers,{*lovere@n2%pl*} Duc{*duk@n*} Jasoun,{*jason@n#propn*}
    public Line parseLine(String line) {
        
        String[] tokens = line.split("\\s+");
        
        return null;
    }

}
