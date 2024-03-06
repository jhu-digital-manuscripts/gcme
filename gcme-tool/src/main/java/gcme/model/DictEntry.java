package gcme.model;

import java.util.ArrayList;
import java.util.List;

// Entry in a dictionary

public class DictEntry {
    private String definition;
    private String lemma;
    private String tagged_lemma;
    private List<String> words;

    public DictEntry(String tagged_lemma, String definition) {
        this.tagged_lemma = tagged_lemma;
        this.definition = definition;
        this.words = new ArrayList<>();

        int i = tagged_lemma.indexOf('@');

        if (i == -1) {
            System.err.println("Malformed tagged lemma: " + tagged_lemma);
            this.lemma = tagged_lemma;
        } else {
            this.lemma = tagged_lemma.substring(0, i);
        }
    }

    public String getDefinition() {
        return definition;
    }

    public String getLemma() {
        return lemma;
    }

    public String getTaggedLemma() {
        return tagged_lemma;
    }

    public List<String> getWords() {
        return words;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((definition == null) ? 0 : definition.hashCode());
        result = prime * result + ((tagged_lemma == null) ? 0 : tagged_lemma.hashCode());
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
        DictEntry other = (DictEntry) obj;
        if (definition == null) {
            if (other.definition != null)
                return false;
        } else if (!definition.equals(other.definition))
            return false;
        if (tagged_lemma == null) {
            if (other.tagged_lemma != null)
                return false;
        } else if (!tagged_lemma.equals(other.tagged_lemma))
            return false;
        if (words == null) {
            if (other.words != null)
                return false;
        } else if (!words.equals(other.words))
            return false;
        return true;
    }

    @Override
    public String toString() {
        return "DictEntry [definition=" + definition + ", tagged_lemma=" + tagged_lemma + ", words=" + words + "]";
    }
}
