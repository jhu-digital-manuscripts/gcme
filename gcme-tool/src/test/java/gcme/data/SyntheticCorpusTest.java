package gcme.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import gcme.TestData;
import gcme.model.DictEntry;
import gcme.model.Line;
import gcme.model.TagTableEntry;
import gcme.model.TextGroup;

/** Tests reading the data against the small synthetic corpus in the test resources. */
class SyntheticCorpusTest {
    private final GcmeData data = TestData.synthetic();

    @Test
    @DisplayName("the hierarchy of texts is built from the location of each group")
    void loadsTextStructure() throws IOException {
        TextGroup root = data.loadTextStructure();

        assertEquals("root", root.id());
        assertEquals(List.of("Ch", "Gow"), ids(root.children()));
        assertEquals("Geoffrey Chaucer", find(root, "Ch").name());

        assertEquals(List.of("CT", "Anel"), ids(find(root, "Ch").children()));
        assertEquals(List.of("Frag1"), ids(find(root, "CT").children()));
        assertEquals(List.of("GP"), ids(find(root, "Frag1").children()));
        assertEquals(List.of("Bk1"), ids(find(root, "CA").children()));

        assertTrue(find(root, "GP").isLeaf());
        assertEquals(List.of("Ch", "CT", "Frag1", "GP"), find(root, "GP").path());
        assertEquals(List.of("Gow", "CA", "Bk1"), find(root, "Bk1").path());
        assertEquals(2, find(root, "Anel").depth());
    }

    @Test
    @DisplayName("text files are ordered by the number their name starts with")
    void loadsTextMapInTextOrder() throws IOException {
        Map<String, List<Path>> map = data.loadTextMap();

        assertEquals(List.of("1-ch.cat", "2-ch.cat"), fileNames(map.get("GP")));
        assertEquals(List.of("9-ch.cat", "10-ch.cat"), fileNames(map.get("Anel")));
        assertEquals(List.of("1-ch.cat", "2-ch.cat", "9-ch.cat", "10-ch.cat"),
                fileNames(map.get("Ch")));
    }

    @Test
    @DisplayName("empty lines of a text file are skipped")
    void parsesText() throws IOException {
        List<Line> lines = data.parseText(TestData.syntheticPath().resolve("texts/ch/gp/2-ch.cat"));

        assertEquals(2, lines.size());
        assertEquals("Aprille shoures soote", lines.getFirst().text());
        assertEquals("Rub", lines.getLast().rawNumber());
        assertEquals(-1, lines.getLast().number());
    }

    @Test
    @DisplayName("a definition from a later dictionary file wins")
    void prefersLastDictionaryFile() throws IOException {
        Map<String, String> definitions = data.loadDictionaryDefinitions();

        assertTrue(definitions.get("of@prep").contains("s.v. of prep. OED"),
                definitions.get("of@prep"));
        assertFalse(definitions.get("rote@n4").contains("anonymous glossary"),
                definitions.get("rote@n4"));
    }

    @Test
    @DisplayName("a duplicate definition in the same file is resolved in favor of the OED")
    void prefersOedDefinition() throws IOException {
        assertTrue(data.loadDictionaryDefinitions().get("line@n").contains("line, cord"));
    }

    @Test
    @DisplayName("wrapped definitions are joined into one entry")
    void unwrapsDefinitions() throws IOException {
        assertEquals("blak adj. \"black; pale,\" s.v. black adj. OED.",
                data.loadDictionaryDefinitions().get("blak@adj"));
    }

    @Test
    @DisplayName("every tagged lemma of the corpus gets an entry with its word forms")
    void loadsDictionary() throws IOException {
        Map<String, DictEntry> dictionary = data.loadDictionary();

        assertEquals(List.of("aprill", "aprille"), List.copyOf(dictionary.get("april@n").words()));
        assertEquals("april", dictionary.get("april@n").lemma());

        // Punctuation is not part of a word form
        assertEquals(List.of("march"), List.copyOf(dictionary.get("marche@n1").words()));

        // A tagged lemma with extra tags falls back on the definition without them
        assertTrue(dictionary.get("shour@n%pl").definition().contains("shower"));
        assertTrue(dictionary.get("geten@v1%inf").definition().contains("get, obtain"));

        // The data has no definition for this one
        assertNotNull(dictionary.get("rubrik@n"));
        assertNull(dictionary.get("rubrik@n").definition());

        // Words which are not tagged are kept here and only left out of the generated dictionaries
        assertEquals(List.of("unknown"), List.copyOf(dictionary.get("not-concorded").words()));
    }

    @Test
    @DisplayName("the tag table keeps the group each tag belongs to")
    void loadsTagTable() throws IOException {
        List<TagTableEntry> table = data.loadTagTable();

        assertEquals(List.of(new TagTableEntry("Part of Speech", "abbrev", "abbr"),
                new TagTableEntry("Part of Speech", "adj#interj", "adj as interjection"),
                new TagTableEntry("Inflection", "%pl", "plural")), table);
    }

    @Test
    @DisplayName("group titles are collected in hierarchy order")
    void loadsGroupTitles() throws IOException {
        Map<String, String> titles = data.loadGroupTitles();

        assertEquals(List.of("root", "Ch", "CT", "Frag1", "GP", "Anel", "Gow", "CA", "Bk1"),
                List.copyOf(titles.keySet()));
        assertEquals("General Prologue", titles.get("GP"));
    }

    private static List<String> ids(List<TextGroup> groups) {
        return groups.stream().map(TextGroup::id).toList();
    }

    private static List<String> fileNames(List<Path> files) {
        return files.stream().map(path -> path.getFileName().toString()).toList();
    }

    private static TextGroup find(TextGroup group, String id) {
        return findGroup(group, id).orElseThrow(() -> new AssertionError("No group with id " + id));
    }

    private static Optional<TextGroup> findGroup(TextGroup group, String id) {
        if (group.id().equals(id)) {
            return Optional.of(group);
        }

        return group.children().stream().map(child -> findGroup(child, id)).flatMap(Optional::stream)
                .findFirst();
    }
}
