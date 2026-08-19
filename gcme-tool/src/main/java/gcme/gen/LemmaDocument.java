package gcme.gen;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Document of the {@code lemma_dict} index which allows the definitions of a lemma to be looked up.
 *
 * <p>The definition at a given position belongs to the tagged lemma at the same position and is
 * {@code null} if the data has no definition for it.
 *
 * @param word word forms of the lemma
 * @param lemma the lemma
 * @param lemmaTag tagged lemmas of the lemma without extra tags
 * @param definition definitions of the tagged lemmas
 */
record LemmaDocument(List<String> word, String lemma,
        @JsonProperty("lemma_tag") List<String> lemmaTag, List<String> definition) {
}
