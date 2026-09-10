package gcme.gen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import gcme.TestData;

/** Tests the generated files against the small synthetic corpus in the test resources. */
class DataGeneratorTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Bulk ingest action which precedes every document of an ndjson file. */
    private static final String INDEX_ACTION = "{ \"index\" : { } }";

    @TempDir
    private static Path output;

    @BeforeAll
    static void generate() throws IOException {
        new DataGenerator(TestData.synthetic(), output).generateAll();
    }

    @Test
    @DisplayName("every file the application needs is generated")
    void generatesEveryFile() {
        Stream.of("line.ndjson", "line.json", "word_dict.ndjson", "word_dict.json",
                "lemma_dict.ndjson", "lemma_dict.json", "lemma_tag_dict.ndjson",
                "lemma_tag_dict.json", DataGenerator.TEXT_POWER_SELECT_FILE,
                DataGenerator.TAG_TABLE_FILE, DataGenerator.GROUP_TITLE_FILE)
                .forEach(name -> assertTrue(Files.isRegularFile(output.resolve(name)), name));
    }

    @Test
    @DisplayName("lines are written once per leaf group in text order")
    void generatesLineDocuments() throws IOException {
        List<JsonNode> lines = array("line.json");

        assertEquals(List.of("gp-1", "gp-1", "gp-2", "gp-2", "anel-9", "anel-10", "gow-1", "gow-1"),
                lines.stream().map(line -> line.get("id").asText()).toList());

        JsonNode first = lines.getFirst();

        assertEquals(1, first.get("number").asInt());
        assertEquals("1", first.get("raw_number").asText());
        assertEquals("Whan that Aprill", first.get("text").asText());
        assertEquals("whan that april", first.get("lemma_text").asText());
        assertEquals("whan@adv&conj that@part april@n", first.get("lemma_tag_text").asText());
        assertEquals(List.of("Ch", "CT", "Frag1", "GP"), strings(first.get("group")));

        // A text directly below an author has a group path of length two
        assertEquals(List.of("Ch", "Anel"), strings(lines.get(4).get("group")));
        assertEquals(List.of("Gow", "CA", "Bk1"), strings(lines.get(6).get("group")));
    }

    @Test
    @DisplayName("a line number which is not a number keeps its raw form")
    void generatesRawLineNumber() throws IOException {
        JsonNode rubric = array("line.json").get(3);

        assertEquals("Rub", rubric.get("raw_number").asText());
        assertEquals(-1, rubric.get("number").asInt());
    }

    @Test
    @DisplayName("the ndjson form holds the same documents preceded by an index action")
    void generatesBulkIngestForm() throws IOException {
        for (String name : List.of("line", "word_dict", "lemma_dict", "lemma_tag_dict")) {
            List<String> ndjson = Files.readAllLines(output.resolve(name + ".ndjson"),
                    StandardCharsets.UTF_8);
            List<JsonNode> documents = array(name + ".json");

            assertEquals(2 * documents.size(), ndjson.size(), name);

            for (int i = 0; i < documents.size(); i++) {
                assertEquals(INDEX_ACTION, ndjson.get(2 * i), name);
                assertEquals(documents.get(i), MAPPER.readTree(ndjson.get(2 * i + 1)), name);
            }
        }
    }

    @Test
    @DisplayName("words are indexed with their tagged lemmas without extra tags")
    void generatesWordDictionary() throws IOException {
        List<JsonNode> words = array("word_dict.json");
        List<String> keys = words.stream().map(word -> word.get("word").asText()).toList();

        assertEquals(keys.stream().sorted().toList(), keys);

        // Words which are not tagged are left out
        assertFalse(keys.contains("unknown"));

        JsonNode shoures = document(words, "word", "shoures");

        assertEquals(List.of("shour@n"), strings(shoures.get("lemma_tag")));
        assertTrue(shoures.get("definition").get(0).asText().contains("shower"));

        // A word without a definition keeps a null so the arrays stay aligned
        JsonNode rubric = document(words, "word", "rubric");

        assertEquals(List.of("rubrik@n"), strings(rubric.get("lemma_tag")));
        assertTrue(rubric.get("definition").get(0).isNull());
    }

    @Test
    @DisplayName("lemmas are indexed with all of their word forms")
    void generatesLemmaDictionary() throws IOException {
        JsonNode april = document(array("lemma_dict.json"), "lemma", "april");

        assertEquals(List.of("aprill", "aprille"), strings(april.get("word")));
        assertEquals(List.of("april@n"), strings(april.get("lemma_tag")));
        assertTrue(april.get("definition").get(0).asText().contains("April"));
    }

    @Test
    @DisplayName("tagged lemmas keep their extra tags and lose the definition field when unknown")
    void generatesLemmaTagDictionary() throws IOException {
        List<JsonNode> lemmaTags = array("lemma_tag_dict.json");

        JsonNode plural = document(lemmaTags, "lemma_tag", "shour@n%pl");

        assertEquals(List.of("shoures"), strings(plural.get("word")));
        assertTrue(plural.get("definition").asText().contains("shower"));

        assertFalse(document(lemmaTags, "lemma_tag", "rubrik@n").has("definition"));
    }

    @Test
    @DisplayName("the text chooser groups texts by author and work")
    void generatesTextPowerSelectData() throws IOException {
        JsonNode options = json(DataGenerator.TEXT_POWER_SELECT_FILE);

        assertEquals(2, options.size());

        JsonNode chaucer = options.get(0);

        assertEquals("Geoffrey Chaucer", chaucer.get("groupName").asText());
        assertEquals("Ch", chaucer.get("options").get(0).get("id").asText());
        assertEquals("The Canterbury Tales", chaucer.get("options").get(1).get("groupName").asText());

        // A text directly below an author becomes a group holding itself
        JsonNode anelida = chaucer.get("options").get(2);

        assertEquals("Anelida and Arcite", anelida.get("groupName").asText());
        assertEquals("Anel", anelida.get("options").get(0).get("id").asText());
    }

    @Test
    @DisplayName("the tag table and the group titles are written for the UI")
    void generatesUiTables() throws IOException {
        JsonNode tags = json(DataGenerator.TAG_TABLE_FILE);

        assertEquals("Part of Speech", tags.get(0).get("group").asText());
        assertEquals("abbrev", tags.get(0).get("tag").asText());
        assertEquals("abbr", tags.get(0).get("description").asText());

        JsonNode titles = json(DataGenerator.GROUP_TITLE_FILE);

        assertEquals("Geoffrey Chaucer", titles.get("Ch").asText());
        assertEquals("General Prologue", titles.get("GP").asText());
    }

    @Test
    @DisplayName("generating twice produces identical files")
    void generatesDeterministicOutput(@TempDir Path first, @TempDir Path second) throws IOException {
        new DataGenerator(TestData.synthetic(), first).generateAll();
        new DataGenerator(TestData.synthetic(), second).generateAll();

        try (Stream<Path> files = Files.list(first)) {
            for (Path file : files.sorted().toList()) {
                Path other = second.resolve(file.getFileName());

                assertEquals(Files.readString(file), Files.readString(other),
                        file.getFileName().toString());
            }
        }
    }

    private static JsonNode json(String name) throws IOException {
        return MAPPER.readTree(output.resolve(name).toFile());
    }

    private static List<JsonNode> array(String name) throws IOException {
        List<JsonNode> result = new ArrayList<>();

        json(name).forEach(result::add);

        return result;
    }

    private static List<String> strings(JsonNode array) {
        List<String> result = new ArrayList<>();

        array.forEach(node -> result.add(node.asText()));

        return result;
    }

    private static JsonNode document(List<JsonNode> documents, String field, String value) {
        return documents.stream().filter(document -> document.get(field).asText().equals(value))
                .findFirst().orElseThrow(() -> new AssertionError(
                        "No document with " + field + " " + value));
    }
}
