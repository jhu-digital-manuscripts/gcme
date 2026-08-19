package gcme.model;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Node in the hierarchy of texts.
 *
 * <p>A group represents either a collection of texts, such as the works of an author or a book, or a
 * single text such as a tale. The top level groups below the root correspond to Chaucer and Gower.
 * Leaf groups are the smallest addressable texts and are the only groups whose lines are indexed
 * directly.
 */
public final class TextGroup {
    private final String id;
    private final String name;
    private final TextGroup parent;
    private final List<TextGroup> children = new ArrayList<>();

    /**
     * Creates a root group.
     *
     * @param id short identifier of the group
     * @param name human readable title of the group
     */
    public TextGroup(String id, String name) {
        this(null, id, name);
    }

    private TextGroup(TextGroup parent, String id, String name) {
        this.id = Objects.requireNonNull(id, "id");
        this.name = Objects.requireNonNull(name, "name");
        this.parent = parent;
    }

    /**
     * Creates a group and adds it as the last child of this group.
     *
     * @param id short identifier of the child
     * @param name human readable title of the child
     * @return the new child group
     */
    public TextGroup addChild(String id, String name) {
        TextGroup child = new TextGroup(this, id, name);
        children.add(child);

        return child;
    }

    /** @return short identifier of the group such as {@code KnT} */
    public String id() {
        return id;
    }

    /** @return human readable title of the group */
    public String name() {
        return name;
    }

    /** @return the containing group or {@code null} if this group is the root */
    public TextGroup parent() {
        return parent;
    }

    /** @return the children of this group in order, empty if this group is a leaf */
    public List<TextGroup> children() {
        return Collections.unmodifiableList(children);
    }

    /** @return {@code true} if this group has no children */
    public boolean isLeaf() {
        return children.isEmpty();
    }

    /** @return number of groups between this group and the root, {@code 0} for the root itself */
    public int depth() {
        int depth = 0;

        for (TextGroup group = parent; group != null; group = group.parent) {
            depth++;
        }

        return depth;
    }

    /**
     * Identifiers of the groups containing this group, ordered from the top level group down to this
     * group. The root is not included.
     *
     * <p>For example a group in the Knight's Tale has the path {@code ["Ch", "CT", "Frag1", "KnT"]}.
     *
     * @return the path of identifiers
     */
    public List<String> path() {
        List<String> path = new ArrayList<>();

        for (TextGroup group = this; group.parent != null; group = group.parent) {
            path.add(group.id);
        }

        return List.copyOf(path.reversed());
    }

    /**
     * Prints this group and its descendants as an indented tree.
     *
     * @param indent number of spaces to indent this group by
     * @param out destination of the printed tree
     */
    public void print(int indent, PrintStream out) {
        out.println(" ".repeat(indent) + id + ": " + name);

        children.forEach(child -> child.print(indent + 2, out));
    }

    @Override
    public String toString() {
        return "TextGroup[id=" + id + ", name=" + name + "]";
    }
}
