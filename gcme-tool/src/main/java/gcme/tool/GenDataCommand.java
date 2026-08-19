package gcme.tool;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Callable;

import gcme.data.GcmeData;
import gcme.gen.DataGenerator;
import picocli.CommandLine.Command;
import picocli.CommandLine.ExitCode;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

/**
 * Generates the files the application is deployed with: bulk ingest requests for OpenSearch
 * ({@code .ndjson}) and the static data of the Ember UI ({@code .json}).
 */
@Command(name = "gen-data", mixinStandardHelpOptions = true,
        description = "Generate the OpenSearch bulk ingest requests and the static Ember UI data.")
final class GenDataCommand implements Callable<Integer> {
    @Parameters(index = "0", paramLabel = "DATA_DIR", defaultValue = "${env:GCME_DATA:-data}",
            description = "Directory holding the raw data. Defaults to $GCME_DATA or ${DEFAULT-VALUE}.")
    private Path dataDirectory;

    @Option(names = {"-o", "--output"}, paramLabel = "OUTPUT_DIR", defaultValue = ".",
            description = "Directory to write the generated files to. Defaults to ${DEFAULT-VALUE}.")
    private Path outputDirectory;

    @Override
    public Integer call() throws Exception {
        Files.createDirectories(outputDirectory);

        new DataGenerator(new GcmeData(dataDirectory), outputDirectory).generateAll();

        return ExitCode.OK;
    }
}
