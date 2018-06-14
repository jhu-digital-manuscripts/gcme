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
}
