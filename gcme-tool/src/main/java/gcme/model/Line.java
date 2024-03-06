package gcme.model;

/**
 * Represents a line of tagged text.
 *
 * The specified line number is usually just an integer, but occasionally is something like 1081B or Rub.
 */
public class Line {
    private String id;
    private int number;
    private String raw_number;
    private String text;
    private String lemma_text;
    private String tag_lemma_text;

    public Line(String id, int number, String raw_number, String text, String tag_lemma_text) {
        this.id = id;
        this.number = number;
        this.raw_number = raw_number;
        this.text = text;
        this.lemma_text = to_lemma_text(tag_lemma_text);
        this.tag_lemma_text = tag_lemma_text;
    }

    private String to_lemma_text(String s) {
        return s.replaceAll("@\\S*", "");
    }

    public String getId() {
        return id;
    }

    public int getNumber() {
        return number;
    }

    public String getRawNumber() {
        return raw_number;
    }


    public String getText() {
        return text;
    }

    public String getLemmaText() {
        return lemma_text;
    }

    public String getTaggedLemmaText() {
        return tag_lemma_text;
    }

    @Override
    public String toString() {
        return id + " " + number + ": " + text + " {" + tag_lemma_text + "}";
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
        result = prime * result + number;
        result = prime * result + ((raw_number == null) ? 0 : raw_number.hashCode());
        result = prime * result + ((tag_lemma_text == null) ? 0 : tag_lemma_text.hashCode());
        result = prime * result + ((text == null) ? 0 : text.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        Line other = (Line) obj;
        if (id == null) {
            if (other.id != null)
                return false;
        } else if (!id.equals(other.id))
            return false;
        if (number != other.number)
            return false;
        if (raw_number == null) {
            if (other.raw_number != null)
                return false;
        } else if (!raw_number.equals(other.raw_number))
            return false;
        if (tag_lemma_text == null) {
            if (other.tag_lemma_text != null)
                return false;
        } else if (!tag_lemma_text.equals(other.tag_lemma_text))
            return false;
        if (text == null) {
            if (other.text != null)
                return false;
        } else if (!text.equals(other.text))
            return false;
        return true;
    }
}
