import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import Bootstrap4Theme from 'ember-models-table/themes/bootstrap4';
import $ from 'jquery';

export default Controller.extend({
  elasticsearch: service(),
  resultTheme: Bootstrap4Theme.create(),
  result: null,
  restrict: null,
  lemmas: null,
  words: null,
  requireAllWords: false,
  sortLogical: false,
  pageSize: 10,
  pageNumber: 1,
  pageCount: 0,

  init() {
    this._super(...arguments);

    this.set('resultColumns', [
      {
        title: 'Location',
        propertyName: '_source.id',
        disableSorting: true,
        component: 'result-location-cell'
      },
      {
        title: 'Number',
        propertyName: '_source.raw_number',
        disableSorting: true
      },
      {
        title: 'Text',
        propertyName: '_source.text',
        disableSorting: true,
        component: 'result-text-line-cell'
      },
      {
        title: 'Lemma text)',
        propertyName: '_source.tag_lemma_text',
        disableSorting: true,
        component: 'result-lemma-line-cell'
      }
    ]);

    this.set('restrictData', $.ajax({url: '/text-powersel.json'}));
  },

  executeQuery() {
    let clause = [];

    if (this.get('words')) {
      this.get('words').forEach(o => {
        clause.push({term: {text: o._match}});
      });
    }

    if (this.get('lemmas')) {
      this.get('lemmas').forEach(o => {
        clause.push({term: {tag_lemma_text: o._match}});
      });
    }

    if (clause.length == 0) {
      return;
    }

    let query = {
      from: (this.get('pageNumber') - 1) * this.get('pageSize'),
      size: this.get('pageSize'),
      query: {
        bool: {
          must: {
            bool: {

            }
          }
        }
      },
      highlight: {
        fields : {
          text: {},
          tag_lemma_text: {}
        }
      }
    };

    if (this.get('requireAllWords')) {
      query.query.bool.must.bool.must = clause;
    } else {
      query.query.bool.must.bool.should = clause;
    }

    if (this.get('restrict')) {
      query.query.bool.filter = {
        term: {
          group: this.get('restrict.id')
        }
      };
    }

    if (this.get('sortLogical')) {
      query.sort = [{ id : 'asc'}, {number: 'asc' }, {raw_number: 'asc'}];
    }

    this.elasticsearch.executeQuery(query).then(result => {
      this.set('result', result);
      this.set('pageCount', Math.ceil(result.hits.total / this.get('pageSize')));
    });
  },

  actions: {
    completeWord(prefix) {
      return this.elasticsearch.complete('word', prefix);
    },

    completeLemma(prefix) {
      return this.elasticsearch.complete('tag_lemma', prefix);
    },

    clearQuery() {
      this.set('lemmas', null);
      this.set('words', null);
      this.set('restrict', null);
      this.set('result', null);
      this.set('pageNumber', 1);
    },

    executeQuery() {
      this.set('pageNumber', 1);

      this.executeQuery();
    },

    prevPage() {
      let i = this.get('pageNumber');

      if (i > 1) {
        this.set('pageNumber', i - 1);
        this.executeQuery();
      }
    },

    nextPage() {
      let i = this.get('pageNumber');

      if (i < this.get('pageCount')) {
        this.set('pageNumber', i + 1);
        this.executeQuery();
      }
    },
  }
});
