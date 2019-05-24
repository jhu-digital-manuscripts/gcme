import sys
import prosodic as pros

# Scripts that transforms tagged text files by adding new metrical tags.
# Use like python add_tags.py input_file output_file


# TODO: Check for errors. Deal with sounded/unsounded e and elisions.

debug = False

# Return the bare word from a token such as that{*that@part*}
# Strip hyphens because prosodic will split token into words.
def get_word(token):
    start = token.find('{*')
    end = token.find('*}')
    return token[0:start].replace('-','')


# Example raw text line:
# 01-1-ch 1 Whan{*whan@adv&conj*} that{*that@part*} Aprill{*april@n*} with{*with@prep*} his{*his@pron1%gen*} shoures{*shour@n%pl*} soote{*sote@adj*}
#
# Prosodic needs this without tags and other information.
#
# Original tags: ich@pron%nom haven@v%pr_1 gret@adj wonder@n bi@prep this@gram_adj light@n
# New tags: ich@pron%nom$u haven@v%pr_1$S gret@adj$ue wonder@n$Su bi@prep$S this@gram_ad$u light@n$Se

def add_tags(gcme_line, gcme_out):
    if gcme_line.isspace():
        return
    
    gcme_tokens = gcme_line.split()
    words = []

    for token in gcme_tokens[2:]:
        words.append(get_word(token))

    if debug:
        gcme_out.write('\n' + 'Original line: ' + gcme_line + '\n')
        gcme_out.write('Bare words: ' + ' '.join(words) + '\n')

    pros_text = pros.Text(' '.join(words))
    pros_text.parse()

    for pros_line in pros_text.lines():
        best_parse = pros_line.bestParse() 
        all_parses = pros_line.allParses()

        if debug:
            gcme_out.write('Best parse: ' + str(best_parse) + '\n')
            gcme_out.write('Meter: ' + str(best_parse.str_meter()) + '\n')
            gcme_out.write('Stress: ' + str(best_parse.str_stress()) + '\n\n')

        pros_words = best_parse.words()
        i = 2

        if (len(gcme_tokens) != len(pros_words) + 2):
            print('Warning: Tokens do not line up.')
            print(str(gcme_tokens))
            print(str(pros_words))

        while i < len(gcme_tokens):
            if (i - 2 >= len(pros_words)):
                i += 1
                continue

            stress = pros_words[i - 2].getStress()
            stress = stress.replace('P', 'S');
            stress = stress.replace('U', 'u');
            
            token = gcme_tokens[i]
            end = token.find('*}')
            token = token[0:end] + '$' + stress + '*}'
            gcme_tokens[i] = token

            i += 1

        gcme_out.write(' '.join(gcme_tokens) + '\n')

    gcme_out.flush()


gcme_in = open(sys.argv[1], "r")
gcme_out = open(sys.argv[2], "w")

for line in gcme_in:
    add_tags(line, gcme_out)

gcme_in.close()
gcme_out.close()
