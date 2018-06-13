package gcme.data;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.junit.Before;
import org.junit.Test;

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
    
    private void check(TextGroup group, Map<String, List<Path>> map) {
        assertNotNull(group.getName());
        assertNotNull(group.getId());
        
        List<Path> files = map.get(group.getId());
        
        if (group.getChildren() == null) {
            assertNotNull(group.toString(), files);
            assertTrue(group.toString(), files.size() > 0);
        
            files.forEach(f -> {
                assertTrue(Files.exists(f));
            });
        }
        
        List<TextGroup> children = group.getChildren();
        
        if (children != null) {
            children.forEach(c -> check(c, map));
        }
    }

}
