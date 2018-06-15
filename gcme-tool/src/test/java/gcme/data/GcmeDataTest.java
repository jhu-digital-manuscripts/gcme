package gcme.data;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

import gcme.model.Line;
import gcme.model.TextGroup;

public class GcmeDataTest {
    private GcmeData data;

    @Before
    public void setup() throws Exception {
        // TODO Make configurable
        data = new GcmeData(Paths.get("/home/msp/prog/gcme/data"));
    }

    @Test
    public void testText() throws Exception {
        TextGroup root = data.loadTextStructure();

        assertNotNull(root);

        root.print(0, System.out);

        Map<String, List<Path>> map = data.loadTextMap();

        assertNotNull(map);

        System.out.println("Map size: " + map.size());

        check(root, map);
    }

    @Test
    public void testParseLine() throws Exception {
        Line line = data.parseLine(
                "107-gow 2455 Ferst{*first@adv*} forto{*forto@part*} gete{*geten@v1%inf*} it{*hit@pron*} out{*oute@adv*} of{*of@prep*} Myne,{*mine@n4*}");

        assertEquals("107-gow", line.getId());
        assertEquals(2455, line.getNumber());
        assertEquals("Ferst forto gete it out of Myne,", line.getWords());
        assertEquals("first@adv forto@part geten@v1%inf hit@pron oute@adv of@prep mine@n4", line.getTaggedLemmas());

    }

    private void check(TextGroup group, Map<String, List<Path>> map) throws IOException {
        assertNotNull(group.getName());
        assertNotNull(group.getId());

        List<Path> files = map.get(group.getId());

        List<TextGroup> children = group.getChildren();

        if (children == null) {
            assertNotNull(group.toString(), files);
            assertTrue(group.toString(), files.size() > 0);

            for (Path f : files) {
                assertTrue(Files.exists(f));

                List<Line> lines = data.parseText(f);

                assertNotNull(lines);
                assertTrue(lines.size() > 0);
            }
        } else {
            for (TextGroup tg : children) {
                check(tg, map);
            }
        }
    }

    
    @Test
    public void testGenerateElasticsearchBulkLineIngest() throws IOException {
        data.generateElasticsearchBulkLineIngest(Paths.get("/tmp/line.ndjson"));
    }
    
    @Test
    public void testLoadDictionaryDefinitions() throws IOException {
        Map<String, String> defs = data.loadDictionaryDefinitions();
        
        assertTrue(defs.size() > 0);
    }
    
}