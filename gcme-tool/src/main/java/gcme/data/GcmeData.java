package gcme.data;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import gcme.model.Corpus;
import gcme.model.Text;

public class GcmeData {
    private final Path path;
    
    public GcmeData(Path path) {
        this.path = path;
    }
    
    
    public List<String> listBooks() {
        List<String> result = new ArrayList<>();
        
        return result;
    }
    
    public Corpus loadBook(String id) {
        Corpus result = new Corpus();
        
        return result;
    };
    
    public Text loadChapter(String id) {
        Text result = new Text();
        
        return result;
    };
    
   
    
}
