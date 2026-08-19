package gcme.gen;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Document of the {@code word_dict} index which allows the definitions of a word to be looked up.
 *
 * <p>A word may have several tagged lemmas. The definition at a given position belongs to the tagged
 * lemma at the same position and is {@code null} if the data has no definition for it.
 *
 * @param word normalized word form
 * @param lemmaTag tagged lemmas of the word without extra tags
 * @param definition definitions of the tagged lemmas
 */
record WordDocument(String word, @JsonProperty("lemma_tag") List<String> lemmaTag,
        List<String> definition) {
}
