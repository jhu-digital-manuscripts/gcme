package gcme.tool;

import java.nio.file.Paths;

import gcme.data.GcmeData;

public class Main {

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("Must have path to data argument and command argument");
            System.exit(1);
        }
        
        GcmeData data = new GcmeData(Paths.get(args[0]));
        String cmd = args[1];
        
        if (cmd.equals("gen-data")) {
            data.generateElasticsearchBulkDictIngest(Paths.get("dict.ndjson"));
            data.generateElasticsearchBulkLineIngest(Paths.get("line.ndjson"));
            
            data.generateTextPowerSelectData(Paths.get("text-powersel.json"));
            data.generateTagTable(Paths.get("tag-table.json"));
        } else if (cmd.equals("info")) {
            data.loadTextStructure().print(0, System.out);
        } else {
            System.err.println("Unknown command: " + cmd);
            System.err.println("Expected: info|gen-data");
        }
    }

}
