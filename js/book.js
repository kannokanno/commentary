import { codeBlock } from './codeblock.js';
import './sidebar.js';
import wasmInit, { attribute_external_links, SearchResult } from './wasm_book.js';

import Finder from './finder.js';
import Mark from 'mark.js';
import TableOfContents from './table-of-contents.js';
import ThemeSelector from './theme-selector.js';

const ELEM_BAR = document.getElementById('searchbar');
const ELEM_WRAPPER = document.getElementById('search-wrapper');
const ELEM_RESULTS = document.getElementById('searchresults');
const ELEM_ICON = document.getElementById('search-toggle');

const ELEM_HEADER = document.getElementById('searchresults-header');
const ELEM_OUTER = document.getElementById('searchresults-outer');

const resultMarker = new Mark(ELEM_RESULTS);

let searchResult;
let finder;

// Eventhandler for keyevents while the searchbar is focused
const keyUpHandler = () => {
  const term = ELEM_BAR.value.trim();

  if (term === '') {
    ELEM_OUTER.classList.add('hidden');
    return;
  }

  const results = finder.search(term);

  ELEM_RESULTS.innerHTML = '';
  ELEM_HEADER.innerText = `${results.length} search results for : ${term}`;

  for (const result of results) {
    searchResult.append_search_result(result.ref, result.doc.body, result.doc.breadcrumbs, term);
  }

  resultMarker.mark(decodeURIComponent(term).split(' '), {
    accuracy: 'complementary',
    exclude: ['a'],
  });

  ELEM_OUTER.classList.remove('hidden');
};

const showSearch = () => {
  ELEM_WRAPPER.classList.remove('hidden');
  ELEM_ICON.setAttribute('aria-expanded', 'true');
  ELEM_BAR.select();
};

const hiddenSearch = () => {
  ELEM_WRAPPER.classList.add('hidden');
  ELEM_ICON.setAttribute('aria-expanded', 'false');
};

// On reload or browser history backwards/forwards events, parse the url and do search or mark
const doSearchOrMarkFromUrl = () => {
  const param = new URLSearchParams(globalThis.location.search).get('highlight');

  if (!param) {
    return;
  }
  const term = decodeURIComponent(param);
  ELEM_BAR.value = term;

  const marker = new Mark(document.getElementById('main'));
  marker.mark(term.split(' '), {
    accuracy: 'complementary',
  });

  for (const x of document.querySelectorAll('mark')) {
    x.addEventListener('mousedown', marker.unmark, { once: true, passive: true });
  }
};

const searchInit = async root => {
  globalThis.search = globalThis.search || {};
  globalThis.search.hasFocus = () => ELEM_BAR === document.activeElement;

  try {
    const [config, _] = await Promise.all([
      fetch(`${root}searchindex.json`).then(response => response.json()),
      wasmInit(),
    ]);

    searchResult = new SearchResult(root, config.results_options.teaser_word_count, config.doc_urls);
    finder = new Finder(config.index.documentStore.docs, config.results_options.limit_results);

    attribute_external_links();
  } catch (e) {
    console.error(`Error during initialization: ${e}`);
    console.log('The search function is disabled.');
    ELEM_ICON.classList.add('hidden');
    return;
  }

  ELEM_BAR.addEventListener('keyup', keyUpHandler, { once: false, passive: true });
  ELEM_ICON.addEventListener(
    'mouseup',
    () => (ELEM_WRAPPER.classList.contains('hidden') ? showSearch() : hiddenSearch()),
    { once: false, passive: true },
  );

  document.addEventListener(
    'keyup',
    e => {
      if (ELEM_WRAPPER.classList.contains('hidden')) {
        switch (e.key) {
          case '/':
          case 's':
          case 'S':
            showSearch();
            break;
        }
        return;
      }

      if (e.key === 'Escape') {
        hiddenSearch();
      }
    },
    { once: false, passive: true },
  );

  // Suppress "submit" events so the page doesn't reload when the user presses Enter
  document.addEventListener('submit', e => e.preventDefault(), { once: false, passive: false });
};

(() => {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      codeBlock();

      new TableOfContents();
      new ThemeSelector();

      doSearchOrMarkFromUrl();
      searchInit(document.getElementById('bookjs').dataset.pathtoroot);
    },
    { once: true, passive: true },
  );
})();
