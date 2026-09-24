/**
 * A small synthetic corpus with the same shape as the generated data files.
 *
 * Two texts sit under `Frag1` so section headings and ordering can be
 * exercised, and the lines deliberately include punctuation, a line numbered
 * `5a` after line `5`, a rubric numbered `Rub`, and an untagged word.
 */

/**
 * Build a line from its text and the tagged lemma of each word, deriving the
 * lemma field so the three fields cannot fall out of alignment.
 *
 * @param {Object} options
 * @returns {Object} A line document.
 */
function line({ id, number, rawNumber, group, text, lemmaTags }) {
  const words = text.split(' ');
  if (words.length !== lemmaTags.length) {
    throw new Error(`Fixture line ${rawNumber} has ${words.length} words and ${lemmaTags.length} tags`);
  }
  return {
    id,
    number,
    raw_number: rawNumber,
    group,
    text,
    lemma_text: lemmaTags
      .map((tag) => (tag === 'not-concorded' ? tag : tag.split('@')[0]))
      .join(' '),
    lemma_tag_text: lemmaTags.join(' '),
  };
}

const GP = ['Ch', 'CT', 'Frag1', 'GP'];
const KNT = ['Ch', 'CT', 'Frag1', 'KnT'];

export const LINES = [
  line({
    id: '01-1-ch',
    number: 1,
    rawNumber: '1',
    group: GP,
    text: 'Whan that Aprill with his shoures soote',
    lemmaTags: [
      'whan@adv&conj',
      'that@part',
      'april@n',
      'with@prep',
      'his@pron1%gen',
      'shour@n%pl',
      'sote@adj',
    ],
  }),
  line({
    id: '01-1-ch',
    number: 2,
    rawNumber: '2',
    group: GP,
    text: 'The droghte of March',
    lemmaTags: ['the@def_art', 'droughte@n', 'of@prep', 'marche@n1'],
  }),
  line({
    id: '01-1-ch',
    number: 3,
    rawNumber: '3',
    group: GP,
    text: 'And bathed every veyne',
    lemmaTags: ['and@conj', 'bathen@v%ppl', 'everi@pron_gram_adj', 'veine@n'],
  }),
  line({
    id: '01-1-ch',
    number: 4,
    rawNumber: '4',
    group: GP,
    text: 'Of which vertu engendred',
    lemmaTags: ['of@prep', 'which@pron', 'vertu@n', 'engendren@v%ppl'],
  }),
  line({
    id: '01-1-ch',
    number: 5,
    rawNumber: '5',
    group: GP,
    text: 'God, that he may',
    lemmaTags: ['god@n1', 'that@part', 'he@pron1', 'mouen@v3%pr_1'],
  }),
  line({
    id: '01-1-ch',
    number: 5,
    rawNumber: '5a',
    group: GP,
    text: 'and eek his wyf',
    lemmaTags: ['and@conj', 'eek@adv', 'his@pron1%gen', 'wif@n'],
  }),
  line({
    id: '01-1-ch',
    number: 10,
    rawNumber: '10',
    group: GP,
    text: 'A god may slepe',
    lemmaTags: ['a@indef_art', 'god@n1', 'mouen@v3%pr_1', 'slepen@v'],
  }),
  line({
    id: '01-2-ch',
    number: -1,
    rawNumber: 'Rub',
    group: KNT,
    text: 'Incipit Narracio',
    lemmaTags: ['not-concorded', 'not-concorded'],
  }),
  line({
    id: '01-2-ch',
    number: 1,
    rawNumber: '1',
    group: KNT,
    text: 'Whilom as olde stories tellen us',
    lemmaTags: [
      'whilom@adv',
      'as@conj',
      'old@adj',
      'storie@n%pl',
      'tellen@v%pr_pl',
      'we@pron1%obj',
    ],
  }),
  line({
    id: '01-2-ch',
    number: 5,
    rawNumber: '5',
    group: KNT,
    text: 'Ther was a god',
    lemmaTags: ['ther@adv', 'ben@v%pa_3', 'a@indef_art', 'god@n1'],
  }),
];

export const WORD_DICT = [
  {
    word: 'god',
    lemma_tag: ['god@adj', 'god@n1'],
    definition: [
      'god adj.\t"good," s.v. good a. OED.',
      'God, god n.(1)\t"God, the deity," s.v. God OED.',
    ],
  },
  {
    word: 'may',
    lemma_tag: ['mai@n1', 'mouen@v3'],
    definition: [
      'mai n.(1)\t"maiden," s.v. may sb. OED.',
      'mouen v.(3)\t"may; be able, have power," s.v. may v. OED.',
    ],
  },
  {
    word: 'shoures',
    lemma_tag: ['shour@n'],
    definition: ['shour n.\t"shower, rain storm," s.v. shower sb. OED.'],
  },
];

export const LEMMA_DICT = [
  { word: ['god'], lemma: 'god', lemma_tag: ['god@adj', 'god@n1'], definition: [null] },
  { word: ['may', 'mowe'], lemma: 'mouen', lemma_tag: ['mouen@v3'], definition: [null] },
];

export const LEMMA_TAG_DICT = [
  {
    lemma_tag: 'god@n1',
    word: ['god'],
    definition: 'God, god n.(1)\t"God, the deity," s.v. God OED.',
  },
  {
    lemma_tag: 'mouen@v3%pr_1',
    word: ['mai', 'may'],
    definition: 'mouen v.(3)\t"may; be able, have power," s.v. may v. OED.',
  },
  {
    lemma_tag: 'shour@n%pl',
    word: ['shoures'],
    definition: 'shour n.\t"shower, rain storm," s.v. shower sb. OED.',
  },
];

export const GROUP_TITLES = {
  root: 'Corpus',
  Ch: 'Geoffrey Chaucer',
  CT: 'The Canterbury Tales',
  Frag1: 'Canterbury Tales - Fragment I',
  GP: 'General Prologoue',
  KnT: "Knight's Tale",
};

export const TEXT_POWERSEL = [
  {
    groupName: 'Geoffrey Chaucer',
    options: [
      { id: 'Ch', label: 'Geoffrey Chaucer' },
      {
        groupName: 'The Canterbury Tales',
        options: [
          { id: 'CT', label: 'The Canterbury Tales' },
          {
            groupName: 'Canterbury Tales - Fragment I',
            options: [
              { id: 'Frag1', label: 'Canterbury Tales - Fragment I' },
              { id: 'GP', label: 'General Prologoue' },
              { id: 'KnT', label: "Knight's Tale" },
            ],
          },
        ],
      },
    ],
  },
];

/** The data the corpus service loads, as one object. */
export function corpusData() {
  return {
    lines: LINES,
    wordDict: WORD_DICT,
    lemmaDict: LEMMA_DICT,
    lemmaTagDict: LEMMA_TAG_DICT,
  };
}

/**
 * Install the fixture in the corpus service of a test's owner.
 *
 * @param {Object} owner The test owner.
 * @returns {Object} The corpus service.
 */
export function setupCorpus(owner) {
  const corpus = owner.lookup('service:corpus');
  corpus.loadForTesting(corpusData());
  return corpus;
}
