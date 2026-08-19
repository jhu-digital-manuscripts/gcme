package gcme.gen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import gcme.TestData;

/**
 * Generates every file from the real corpus and checks the result is complete and well formed. The
 * corpus is taken from {@code $GCME_DATA} and defaults to the {@code data} directory of the
 * repository.
 */
class DataGeneratorCorpusTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @TempDir
    private static Path output;

    @BeforeAll
    static void generate() throws IOException {
        assertTrue(TestData.hasCorpus(),
                "The corpus was not found at " + TestData.corpusPath().toAbsolutePath()
                        + ". Set GCME_DATA to the data directory.");

        new DataGenerator(TestData.corpus(), output).generateAll();
    }

    @Test
    @DisplayName("each index gets a bulk ingest request and an array of the same documents")
    void generatesBothFormsOfEveryIndex() throws IOException {
        for (String name : List.of(DataGenerator.LINE, DataGenerator.WORD_DICT,
                DataGenerator.LEMMA_DICT, DataGenerator.LEMMA_TAG_DICT)) {
            long ndjsonLines;

            try (Stream<String> lines =
                    Files.lines(output.resolve(name + ".ndjson"), StandardCharsets.UTF_8)) {
                ndjsonLines = lines.count();
            }

            JsonNode documents = MAPPER.readTree(output.resolve(name + ".json").toFile());

            assertTrue(documents.isArray(), name);
            assertTrue(documents.size() > 1000, name + " has " + documents.size() + " documents");
            assertEquals(2L * documents.size(), ndjsonLines, name);
        }
    }

    @Test
    @DisplayName("lines of the corpus start with the General Prologue of the Canterbury Tales")
    void generatesLinesInTextOrder() throws IOException {
        JsonNode lines = MAPPER.readTree(output.resolve("line.json").toFile());
        JsonNode first = lines.get(0);

        assertEquals("01-1-ch", first.get("id").asText());
        assertEquals(1, first.get("number").asInt());
        assertEquals("Whan that Aprill with his shoures soote", first.get("text").asText());
        assertEquals(List.of("Ch", "CT", "Frag1", "GP"),
                List.of(first.get("group").get(0).asText(), first.get("group").get(1).asText(),
                        first.get("group").get(2).asText(), first.get("group").get(3).asText()));
    }

    @Test
    @DisplayName("the static files of the UI are generated")
    void generatesUiFiles() throws IOException {
        JsonNode options = MAPPER.readTree(output.resolve(DataGenerator.TEXT_POWER_SELECT_FILE).toFile());

        assertEquals("Geoffrey Chaucer", options.get(0).get("groupName").asText());
        assertEquals("John Gower", options.get(1).get("groupName").asText());

        JsonNode tags = MAPPER.readTree(output.resolve(DataGenerator.TAG_TABLE_FILE).toFile());

        assertTrue(tags.size() > 10, "tag table has " + tags.size() + " rows");

        JsonNode titles = MAPPER.readTree(output.resolve(DataGenerator.GROUP_TITLE_FILE).toFile());

        assertEquals("Geoffrey Chaucer", titles.get("Ch").asText());
        assertEquals("Knight's Tale", titles.get("KnT").asText());
    }
}
