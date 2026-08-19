package gcme.model;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.SequencedSet;

/**
 * Dictionary entry for a tagged lemma such as {@code mouen@v3%pr_1}.
 *
 * <p>The entry holds the dictionary definition of the tagged lemma, if the data has one, and the
 * distinct word forms which occur in the corpus for it. Word forms are kept in the order they are
 * first encountered.
 */
public final class DictEntry {
    private final String taggedLemma;
    private final String lemma;
    private final String definition;
    private final SequencedSet<String> words = new LinkedHashSet<>();

    /**
     * @param taggedLemma the tagged lemma, for example {@code mouen@v3%pr_1}
     * @param definition dictionary definition of the tagged lemma or {@code null} if there is none
     */
    public DictEntry(String taggedLemma, String definition) {
        this.taggedLemma = Objects.requireNonNull(taggedLemma, "taggedLemma");
        this.definition = definition;
        this.lemma = lemmaOf(taggedLemma);
    }

    private static String lemmaOf(String taggedLemma) {
        int i = taggedLemma.indexOf('@');

        if (i == -1) {
            System.err.println("Malformed tagged lemma: " + taggedLemma);
            return taggedLemma;
        }

        return taggedLemma.substring(0, i);
    }

    /** @return the tagged lemma, for example {@code mouen@v3%pr_1} */
    public String taggedLemma() {
        return taggedLemma;
    }

    /** @return the lemma of the tagged lemma, for example {@code mouen} */
    public String lemma() {
        return lemma;
    }

    /** @return the dictionary definition or {@code null} if the data does not have one */
    public String definition() {
        return definition;
    }

    /** @return the distinct word forms of this entry in the order they were added */
    public SequencedSet<String> words() {
        return Collections.unmodifiableSequencedSet(words);
    }

    /**
     * Records a word form of this tagged lemma. Duplicates are ignored.
     *
     * @param word word form as it occurs in the corpus
     */
    public void addWord(String word) {
        words.add(Objects.requireNonNull(word, "word"));
    }

    @Override
    public String toString() {
        return "DictEntry[taggedLemma=" + taggedLemma + ", definition=" + definition + ", words="
                + words + "]";
    }
}
