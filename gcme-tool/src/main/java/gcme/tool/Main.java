package gcme.tool;

import java.nio.file.Paths;

import gcme.data.GcmeData;

public class Main {

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            System.err.println("Must have path to data argument.");
            System.exit(1);
        }
        
        GcmeData data = new GcmeData(Paths.get(args[0]));
        
        data.loadTextStructure();
    }

}
