package gcme.gen;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Entry of the text chooser used by the Ember UI. An entry is either a selectable option with an
 * identifier and a label or a named group of entries.
 *
 * @param id identifier of the group the option selects, {@code null} for a group of options
 * @param label human readable title of the option, {@code null} for a group of options
 * @param groupName human readable title of the group, {@code null} for an option
 * @param options entries of the group, {@code null} for an option
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
record PowerSelectOption(String id, String label, String groupName,
        List<PowerSelectOption> options) {

    /** Creates a selectable option. */
    static PowerSelectOption option(String id, String label) {
        return new PowerSelectOption(id, label, null, null);
    }

    /** Creates a named group of entries. */
    static PowerSelectOption group(String groupName, List<PowerSelectOption> options) {
        return new PowerSelectOption(null, null, groupName, options);
    }
}
