package gcme.tool;

import java.util.concurrent.Callable;

import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.ExitCode;
import picocli.CommandLine.Model.CommandSpec;
import picocli.CommandLine.Spec;

/**
 * Command line entry point of the tool.
 *
 * <p>The tool reads the raw GCME data and either describes it or transforms it into the files the
 * application is deployed with. Run it without arguments to see the available commands.
 */
@Command(name = "gcme-tool", mixinStandardHelpOptions = true, version = "gcme-tool 0.0.1",
        synopsisSubcommandLabel = "COMMAND",
        description = "Transforms the GCME data into static files for the Ember UI and "
                + "bulk ingest documents for OpenSearch.",
        subcommands = {InfoCommand.class, GenDataCommand.class})
public final class Main implements Callable<Integer> {
    @Spec
    private CommandSpec spec;

    /**
     * Runs the tool.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        System.exit(new CommandLine(new Main())
                .setExecutionExceptionHandler((exception, commandLine, parseResult) -> {
                    commandLine.getErr().println(exception.toString());

                    return ExitCode.SOFTWARE;
                }).execute(args));
    }

    /** Prints the usage help because a command is required. */
    @Override
    public Integer call() {
        spec.commandLine().usage(System.err);

        return ExitCode.USAGE;
    }
}
