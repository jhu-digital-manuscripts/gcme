package gcme.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import gcme.TestData;
import gcme.model.DictEntry;
import gcme.model.Line;
import gcme.model.TextGroup;

/**
 * Tests reading the real corpus. The corpus is taken from {@code $GCME_DATA} and defaults to the
 * {@code data} directory of the repository.
 */
class GcmeDataTest {
    private final GcmeData data = TestData.corpus();

    @BeforeAll
    static void requireCorpus() {
        assertTrue(TestData.hasCorpus(),
                "The corpus was not found at " + TestData.corpusPath().toAbsolutePath()
                        + ". Set GCME_DATA to the data directory.");
    }

    @Test
    @DisplayName("every leaf group has text files which parse")
    void loadsEveryText() throws IOException {
        TextGroup root = data.loadTextStructure();
        Map<String, List<Path>> map = data.loadTextMap();

        assertFalse(map.isEmpty());

        check(root, map);
    }

    private void check(TextGroup group, Map<String, List<Path>> map) throws IOException {
        assertNotNull(group.name());
        assertNotNull(group.id());

        if (!group.isLeaf()) {
            for (TextGroup child : group.children()) {
                check(child, map);
            }

            return;
        }

        List<Path> files = map.get(group.id());

        assertNotNull(files, group::toString);
        assertFalse(files.isEmpty(), group::toString);

        for (Path file : files) {
            assertTrue(Files.exists(file), file::toString);

            List<Line> lines = data.parseText(file);

            assertFalse(lines.isEmpty(), file::toString);
        }
    }

    @Test
    @DisplayName("the hierarchy starts with the two authors")
    void loadsAuthors() throws IOException {
        TextGroup root = data.loadTextStructure();

        assertEquals(List.of("Ch", "Gow"), root.children().stream().map(TextGroup::id).toList());
    }

    @Test
    @DisplayName("group paths hold between two and four identifiers")
    void loadsGroupPaths() throws IOException {
        checkPaths(data.loadTextStructure());
    }

    private void checkPaths(TextGroup group) {
        if (group.isLeaf()) {
            int size = group.path().size();

            assertTrue(size >= 2 && size <= 4, () -> group + " has path " + group.path());
        } else {
            group.children().forEach(this::checkPaths);
        }
    }

    @Test
    @DisplayName("dictionary definitions are found")
    void loadsDictionaryDefinitions() throws IOException {
        Map<String, String> definitions = data.loadDictionaryDefinitions();

        assertFalse(definitions.isEmpty());
        assertTrue(definitions.containsKey("mouen@v3"), "mouen@v3 has a definition");
    }

    @Test
    @DisplayName("the dictionary covers the tagged lemmas of the corpus")
    void loadsDictionary() throws IOException {
        Map<String, DictEntry> dictionary = data.loadDictionary();

        assertFalse(dictionary.isEmpty());

        DictEntry entry = dictionary.get("mouen@v3%pr_1");

        assertNotNull(entry, "mouen@v3%pr_1 occurs in the corpus");
        assertEquals("mouen", entry.lemma());
        assertTrue(entry.words().contains("may"), entry::toString);
        assertNotNull(entry.definition(), entry::toString);
    }
}
