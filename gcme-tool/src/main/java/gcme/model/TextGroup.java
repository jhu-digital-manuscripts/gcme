package gcme.model;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;

// A TextGroup is a node in a hierarchy.
// Each node represents either a group of text such as a corpus or a book or text.

public class TextGroup {
    private String id;
    private String name;

    private TextGroup parent;
    private List<TextGroup> children;

    public TextGroup(TextGroup parent, String id, String name) {
        this.id = id;
        this.name = name;
        this.parent = parent;

        if (parent != null) {
            if (parent.children == null) {
                parent.children = new ArrayList<>();
            }

            parent.children.add(this);
        }
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public TextGroup getParent() {
        return parent;
    }

    public List<TextGroup> getChildren() {
        return children;
    }
    
    public boolean hasChildren() {
        return children != null && children.size() > 0;
    }
    
    public void print(final int indent, PrintStream out) {
        for (int i = 0; i < indent; i++ ) {
            out.print(' ');
        }
        
        out.println(id + ": " + name);
        
        if (children != null) {
            children.forEach(c -> c.print(indent + 2, out));
        }
    }

    @Override
    public String toString() {
        return "TextGroup [id=" + id + ", name=" + name + "]";
    }
}
