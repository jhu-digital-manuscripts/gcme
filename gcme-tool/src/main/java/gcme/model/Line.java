package gcme.model;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * A line of tagged text.
 *
 * <p>Every word of {@link #text()} has a corresponding tagged lemma in {@link #taggedLemmaText()} at
 * the same position. Consider the word {@code may{*mouen@v3%pr_1*}} which has the tagged lemma
 * {@code mouen@v3%pr_1}, the lemma {@code mouen}, and the tag {@code v3%pr_1}.
 *
 * @param id identifier of the text containing the line
 * @param number line number extracted from {@link #rawNumber()}, or {@code -1} if it contains no
 *        digits
 * @param rawNumber number as it appears in the data, usually an integer but occasionally something
 *        like {@code 1081B} or {@code Rub}
 * @param text the original words of the line separated by single spaces
 * @param lemmaText the lemmas of the words of the line separated by single spaces
 * @param taggedLemmaText the tagged lemmas of the words of the line separated by single spaces
 */
public record Line(String id, int number, String rawNumber, String text, String lemmaText,
        String taggedLemmaText) {

    /** Matches the tag portion of a tagged lemma so it can be stripped. */
    private static final Pattern TAG = Pattern.compile("@\\S*");

    public Line {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(rawNumber, "rawNumber");
        Objects.requireNonNull(text, "text");
        Objects.requireNonNull(lemmaText, "lemmaText");
        Objects.requireNonNull(taggedLemmaText, "taggedLemmaText");
    }

    /**
     * Creates a line, deriving {@link #lemmaText()} by stripping the tags from the tagged lemmas.
     *
     * @param id identifier of the text containing the line
     * @param number line number
     * @param rawNumber number as it appears in the data
     * @param text the original words of the line separated by single spaces
     * @param taggedLemmaText the tagged lemmas of the words of the line separated by single spaces
     * @return the line
     */
    public static Line of(String id, int number, String rawNumber, String text,
            String taggedLemmaText) {
        Objects.requireNonNull(taggedLemmaText, "taggedLemmaText");

        return new Line(id, number, rawNumber, text, TAG.matcher(taggedLemmaText).replaceAll(""),
                taggedLemmaText);
    }
}
