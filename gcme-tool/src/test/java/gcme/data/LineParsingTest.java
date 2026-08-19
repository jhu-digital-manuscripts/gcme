package gcme.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.file.Path;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import gcme.model.Line;

/** Tests parsing of a single line of tagged text, which needs no data directory. */
class LineParsingTest {
    private final GcmeData data = new GcmeData(Path.of("."));

    @Test
    @DisplayName("words, lemmas, and tagged lemmas are separated")
    void parsesWordsAndTaggedLemmas() throws IOException {
        Line line = data.parseLine("107-gow 2455 Ferst{*first@adv*} forto{*forto@part*} "
                + "gete{*geten@v1%inf*} it{*hit@pron*} out{*oute@adv*} of{*of@prep*} Myne,{*mine@n4*}");

        assertEquals("107-gow", line.id());
        assertEquals(2455, line.number());
        assertEquals("2455", line.rawNumber());
        assertEquals("Ferst forto gete it out of Myne,", line.text());
        assertEquals("first@adv forto@part geten@v1%inf hit@pron oute@adv of@prep mine@n4",
                line.taggedLemmaText());
        assertEquals("first forto geten hit oute of mine", line.lemmaText());
    }

    @ParameterizedTest
    @CsvSource({"1368, 1368", "1081B, 1081", "B1081, 1081", "Rub, -1"})
    @DisplayName("the line number is the digits of the raw number")
    void keepsDigitsOfRawNumber(String rawNumber, int expected) throws IOException {
        Line line = data.parseLine("100-ch " + rawNumber + " rote{*rote@n4*}");

        assertEquals(expected, line.number());
        assertEquals(rawNumber, line.rawNumber());
    }

    @Test
    @DisplayName("a line needs an id, a number, and at least one word")
    void rejectsLineWithoutWords() {
        assertThrows(IOException.class, () -> data.parseLine("100-ch 1368"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"100-ch 1 rote{*rote@n4*}trailing", "100-ch 1 rote{*rote@n4*"})
    @DisplayName("malformed tokens are rejected")
    void rejectsMalformedToken(String line) {
        assertThrows(IOException.class, () -> data.parseLine(line));
    }

    @Test
    @DisplayName("surrounding and repeated whitespace is ignored")
    void ignoresExtraWhitespace() throws IOException {
        Line line = data.parseLine("  100-ch   1368   rote{*rote@n4*}   of{*of@prep*}  ");

        assertEquals("rote of", line.text());
        assertEquals("rote@n4 of@prep", line.taggedLemmaText());
    }
}
