package gcme;

import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Objects;

import gcme.data.GcmeData;

/** Locates the data the tests run against. */
public final class TestData {
    /** Directory of the real data used by tests which need the whole corpus. */
    private static final String DEFAULT_DATA_DIRECTORY = "../data";

    private TestData() {
    }

    /**
     * @return the small synthetic corpus which ships with the tests
     */
    public static GcmeData synthetic() {
        return new GcmeData(syntheticPath());
    }

    /**
     * @return directory of the small synthetic corpus which ships with the tests
     */
    public static Path syntheticPath() {
        try {
            return Path.of(Objects.requireNonNull(TestData.class.getResource("/corpus"),
                    "synthetic corpus is missing from the test resources").toURI());
        } catch (URISyntaxException e) {
            throw new IllegalStateException(e);
        }
    }

    /**
     * @return the real corpus, taken from {@code $GCME_DATA} or {@value #DEFAULT_DATA_DIRECTORY}
     */
    public static GcmeData corpus() {
        return new GcmeData(corpusPath());
    }

    /**
     * @return directory of the real corpus, taken from {@code $GCME_DATA} or
     *         {@value #DEFAULT_DATA_DIRECTORY}
     */
    public static Path corpusPath() {
        String path = System.getenv("GCME_DATA");

        return Path.of(path == null ? DEFAULT_DATA_DIRECTORY : path);
    }

    /**
     * @return {@code true} if the real corpus is available
     */
    public static boolean hasCorpus() {
        return Files.isDirectory(corpusPath().resolve("texts"));
    }
}
