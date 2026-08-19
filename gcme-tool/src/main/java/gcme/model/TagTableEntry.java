package gcme.model;

import java.util.Objects;

/**
 * Row of the part of speech tag table.
 *
 * @param group title of the group of tags the tag belongs to, for example {@code Part of Speech}
 * @param tag the tag itself, for example {@code adj#interj}
 * @param description human readable description of the tag
 */
public record TagTableEntry(String group, String tag, String description) {
    public TagTableEntry {
        Objects.requireNonNull(group, "group");
        Objects.requireNonNull(tag, "tag");
        Objects.requireNonNull(description, "description");
    }
}
