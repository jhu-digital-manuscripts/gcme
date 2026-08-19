package gcme.tool;

import java.nio.file.Path;
import java.util.concurrent.Callable;

import gcme.data.GcmeData;
import picocli.CommandLine.Command;
import picocli.CommandLine.ExitCode;
import picocli.CommandLine.Parameters;

/** Prints the hierarchy of texts found in the data. */
@Command(name = "info", mixinStandardHelpOptions = true,
        description = "Print the hierarchy of texts with their identifiers and titles.")
final class InfoCommand implements Callable<Integer> {
    @Parameters(index = "0", paramLabel = "DATA_DIR", defaultValue = "${env:GCME_DATA:-data}",
            description = "Directory holding the raw data. Defaults to $GCME_DATA or ${DEFAULT-VALUE}.")
    private Path dataDirectory;

    @Override
    public Integer call() throws Exception {
        new GcmeData(dataDirectory).loadTextStructure().print(0, System.out);

        return ExitCode.OK;
    }
}
