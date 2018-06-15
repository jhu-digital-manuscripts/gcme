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
    
    private String words;
    private String tagged_lemmas;
    
    public Line(String id, int number, String raw_number, String words, String tagged_lemmas) {
        this.id = id;
        this.number = number;
        this.raw_number = raw_number;
        this.words = words;
        this.tagged_lemmas = tagged_lemmas;
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
    

    public String getWords() {
        return words;
    }

    public String getTaggedLemmas() {
        return tagged_lemmas;
    }

    @Override
    public String toString() {
        return id + " " + number + ": " + words + " {" + tagged_lemmas + "}";
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((id == null) ? 0 : id.hashCode());
        result = prime * result + number;
        result = prime * result + ((raw_number == null) ? 0 : raw_number.hashCode());
        result = prime * result + ((tagged_lemmas == null) ? 0 : tagged_lemmas.hashCode());
        result = prime * result + ((words == null) ? 0 : words.hashCode());
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
        if (tagged_lemmas == null) {
            if (other.tagged_lemmas != null)
                return false;
        } else if (!tagged_lemmas.equals(other.tagged_lemmas))
            return false;
        if (words == null) {
            if (other.words != null)
                return false;
        } else if (!words.equals(other.words))
            return false;
        return true;
    }
}
