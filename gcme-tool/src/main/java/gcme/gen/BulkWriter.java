package gcme.gen;

import java.io.Closeable;
import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

/**
 * Writes a set of documents in the two forms the application consumes.
 *
 * <p>The {@code .ndjson} form is a bulk ingest request for OpenSearch in which every document is
 * preceded by an index action. The {@code .json} form is an array of the same documents which the
 * Ember UI loads when it searches locally instead of using OpenSearch.
 */
final class BulkWriter implements Closeable {
    /** Bulk ingest action which lets OpenSearch assign the document identifier. */
    private static final String INDEX_ACTION = "{ \"index\" : { } }";

    private final ObjectWriter writer;
    private final Writer ndjson;
    private final JsonGenerator json;

    /**
     * Creates a writer for a set of documents, writing {@code name.ndjson} and {@code name.json} in
     * the given directory.
     *
     * @param mapper mapper used to serialize documents
     * @param directory directory to write the files to
     * @param name base name of the files, for example {@code line}
     * @return the open writer
     * @throws IOException if a file cannot be created
     */
    static BulkWriter create(ObjectMapper mapper, Path directory, String name) throws IOException {
        Writer ndjson =
                Files.newBufferedWriter(directory.resolve(name + ".ndjson"), StandardCharsets.UTF_8);

        try {
            JsonGenerator json = mapper.createGenerator(Files
                    .newBufferedWriter(directory.resolve(name + ".json"), StandardCharsets.UTF_8));

            try {
                json.writeStartArray();

                return new BulkWriter(mapper.writer(), ndjson, json);
            } catch (IOException | RuntimeException e) {
                json.close();

                throw e;
            }
        } catch (IOException | RuntimeException e) {
            ndjson.close();

            throw e;
        }
    }

    private BulkWriter(ObjectWriter writer, Writer ndjson, JsonGenerator json) {
        this.writer = writer;
        this.ndjson = ndjson;
        this.json = json;
    }

    /**
     * Writes a document to both files.
     *
     * @param document document to serialize
     * @throws IOException if the document cannot be written
     */
    void write(Object document) throws IOException {
        ndjson.write(INDEX_ACTION);
        ndjson.write('\n');
        ndjson.write(writer.writeValueAsString(document));
        ndjson.write('\n');

        json.writeObject(document);
    }

    @Override
    public void close() throws IOException {
        try (Writer unused = ndjson; JsonGenerator array = json) {
            array.writeEndArray();
        }
    }
}
