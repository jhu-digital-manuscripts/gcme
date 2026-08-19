package gcme.gen;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Document of the {@code lemma_tag_dict} index which allows the definition of a tagged lemma to be
 * looked up. The definition is left out of the document if the data has none.
 *
 * @param lemmaTag the tagged lemma
 * @param word word forms of the tagged lemma
 * @param definition definition of the tagged lemma or {@code null} if there is none
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
record LemmaTagDocument(@JsonProperty("lemma_tag") String lemmaTag, List<String> word,
        String definition) {
}
