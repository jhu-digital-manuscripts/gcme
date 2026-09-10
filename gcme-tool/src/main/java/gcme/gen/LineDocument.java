package gcme.gen;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Document of the {@code line} index which allows lines to be searched by word or tagged lemma.
 *
 * @param id identifier assigned to the line
 * @param number number of the line
 * @param rawNumber number of the line as it appears in the data
 * @param group identifiers of the 2-4 groups containing the line, from top level to parent
 * @param text the original words of the line
 * @param lemmaText the lemmas of the words of the line
 * @param lemmaTagText the tagged lemmas of the words of the line
 */
record LineDocument(String id, int number, @JsonProperty("raw_number") String rawNumber,
        List<String> group, String text, @JsonProperty("lemma_text") String lemmaText,
        @JsonProperty("lemma_tag_text") String lemmaTagText) {
}
