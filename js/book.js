'use strict';

// Global variable, shared between modules
const playground_text = (playground, hidden = true) => {
  return hidden ? playground.querySelector('code').textContent : playground.querySelector('code').innerText;
};

// codeSnippets
(() => {
  // Syntax highlighting Configuration
  hljs.configure({
    languages: ['txt'],
  });
  hljs.highlightAll();

  Array.from(document.querySelectorAll('code'))
    // Don't highlight `inline code` blocks in headers.
    .filter(node => {
      return !node.parentElement.classList.contains('header');
    })
    .forEach(block => {
      block.classList.add('hljs');
    });

  if (window.playground_copyable) {
    Array.from(document.querySelectorAll('pre code')).forEach(block => {
      const pre_block = block.parentNode;

      let buttons = pre_block.querySelector('.buttons');

      if (!buttons) {
        buttons = document.createElement('div');
        buttons.className = 'buttons';
        pre_block.insertBefore(buttons, pre_block.firstChild);
      }

      const clipButton = document.createElement('button');
      clipButton.className = 'fa-copy clip-button';
      clipButton.title = 'Copy to clipboard';
      clipButton.setAttribute('aria-label', clipButton.title);
      clipButton.innerHTML = '<i class="tooltiptext"></i>';

      buttons.insertBefore(clipButton, buttons.firstChild);
    });
  }
})();

// themes
(() => {
  const html = document.querySelector('html');
  const defaultTheme = document.getElementById('book').dataset.defaulttheme;

  const themeToggleButton = document.getElementById('theme-toggle');
  const themePopup = document.getElementById('theme-list');
  const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');

  const get_theme = () => {
    let theme;

    try {
      theme = localStorage.getItem('mdbook-theme');
    } catch (_e) {
      console.log('ERROR: get_theme#mdbook-theme');
    }
    return theme != null ? theme : defaultTheme;
  };

  const updateThemeSelected = () => {
    themePopup.querySelectorAll('.theme-selected').forEach(el => {
      el.classList.remove('theme-selected');
    });

    themePopup.querySelector('button#' + get_theme()).classList.add('theme-selected');
  };

  const set_theme = (theme, store = true) => {
    setTimeout(() => {
      themeColorMetaTag.content = window.getComputedStyle(document.body).backgroundColor;
    }, 1);

    const previousTheme = get_theme();

    if (store) {
      try {
        localStorage.setItem('mdbook-theme', theme);
      } catch (_e) {
        console.log('ERROR: set_theme#mdbook-theme');
      }
    }

    html.classList.remove(previousTheme);
    html.classList.add(theme);

    updateThemeSelected();
  };

  const hideThemes = () => {
    themePopup.style.display = 'none';
    themeToggleButton.setAttribute('aria-expanded', false);
    themeToggleButton.focus();
  };

  const showThemes = () => {
    themePopup.style.display = 'block';
    themeToggleButton.setAttribute('aria-expanded', true);
    themePopup.querySelector('button#' + get_theme()).focus();
  };

  // Set theme
  set_theme(get_theme(), false);

  themeToggleButton.addEventListener('click', () => {
    themePopup.style.display === 'block' ? hideThemes() : showThemes();
  });

  themePopup.addEventListener('click', e => {
    let theme;

    if (e.target.className === 'theme') {
      theme = e.target.id;
    } else if (e.target.parentElement.className === 'theme') {
      theme = e.target.parentElement.id;
    } else {
      return;
    }
    set_theme(theme);
  });

  themePopup.addEventListener('focusout', e => {
    // e.relatedTarget is null in Safari and Firefox on macOS (see workaround below)
    if (!!e.relatedTarget && !themeToggleButton.contains(e.relatedTarget) && !themePopup.contains(e.relatedTarget)) {
      hideThemes();
    }
  });

  // Should not be needed, but it works around an issue on macOS & iOS: https://github.com/rust-lang/mdBook/issues/628
  document.addEventListener('click', e => {
    if (
      themePopup.style.display === 'block' &&
      !themeToggleButton.contains(e.target) &&
      !themePopup.contains(e.target)
    ) {
      hideThemes();
    }
  });

  document.addEventListener('keydown', e => { if (themePopup.contains(e.target)) {
    e.preventDefault();
    hideThemes();
  }});
})();

// sidebar
(() => {
  const html = document.querySelector('html');
  const sidebar = document.getElementById('sidebar');
  const sidebarLinks = document.querySelectorAll('#sidebar a');
  const sidebarToggleButton = document.getElementById('sidebar-toggle');

  let firstContact = null;

  const toggleSection = ev => {
    ev.currentTarget.parentElement.classList.toggle('expanded');
  };

  Array.from(document.querySelectorAll('#sidebar a.toggle')).forEach(el => {
    el.addEventListener('click', toggleSection);
  });

  const showSidebar = () => {
    if (html.classList.contains('sidebar-visible')) {
      return;
    }

    html.classList.remove('sidebar-hidden');
    html.classList.add('sidebar-visible');

    Array.from(sidebarLinks).forEach(link => {
      link.setAttribute('tabIndex', 0);
    });

    sidebarToggleButton.setAttribute('aria-expanded', true);
    sidebar.setAttribute('aria-hidden', false);

    try {
      localStorage.setItem('mdbook-sidebar', 'visible');
    } catch (_e) {
      console.log('ERROR: showSidebar');
    }
  };

  const hideSidebar = () => {
    if (html.classList.contains('sidebar-hidden')) {
      return;
    }

    html.classList.remove('sidebar-visible');
    html.classList.add('sidebar-hidden');

    Array.from(sidebarLinks).forEach(link => {
      link.setAttribute('tabIndex', -1);
    });

    sidebarToggleButton.setAttribute('aria-expanded', false);
    sidebar.setAttribute('aria-hidden', true);

    try {
      localStorage.setItem('mdbook-sidebar', 'hidden');
    } catch (_e) {
      console.log('ERROR: hideSidebar');
    }
  };

  // Toggle sidebar
  sidebarToggleButton.addEventListener('click', () => {
    html.classList.contains('sidebar-hidden') ? showSidebar() : hideSidebar();
  });

  let timeoutId;

  globalThis.addEventListener('resize', () => {
    clearTimeout(timeoutId);

      // FIXME: The definitions are all over the place.
    timeoutId = setTimeout(() => { if (window.innerWidth >= 1200) {
      showSidebar();
    }}, 200);
  });

  document.addEventListener(
    'touchstart',
    e => {
      firstContact = {
        x: e.touches[0].clientX,
        time: Date.now(),
      };
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    e => {
      if (!firstContact) {
        return;
      }

      if (Date.now() - firstContact.time > 250) {
        return;
      }
      const curX = e.touches[0].clientX;
      const xDiff = curX - firstContact.x;

      if (Math.abs(xDiff) >= 150) {
        if (xDiff >= 0) {
          if (firstContact.x < Math.min(document.body.clientWidth * 0.25, 300)) {
            showSidebar();
          }
        } else {
          if (curX < 300) {
            hideSidebar();
          }
        }
        firstContact = null;
      }
    },
    { passive: true }
  );

  // Scroll sidebar to current active section
  const activeSection = document.getElementById('sidebar').querySelector('.active');

  if (activeSection) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
    activeSection.scrollIntoView({ block: 'center' });
  }

  // FIXME: The definitions are all over the place.
  if (window.innerWidth < 750) {
    hideSidebar();
  }
})();

// chapterNavigation
(() => {
  document.addEventListener('keyup', e => {
    if (window.search.hasFocus()) {
      return;
    }

    if (e.key == 'ArrowRight') {
      e.preventDefault();

      const nextButton = document.querySelector('.mobile-nav-chapters.next');

      if (nextButton) {
        window.location.href = nextButton.href;
      }
    }
    else if (e.key == 'ArrowLeft'){
      e.preventDefault();

      const previousButton = document.querySelector('.mobile-nav-chapters.previous');

      if (previousButton) {
        window.location.href = previousButton.href;
      }
    }
  });
})();

// clipboard
(() => {
  const hideTooltip = elem => {
    elem.firstChild.innerText = '';
    elem.className = 'fa-copy clip-button';
  };

  const showTooltip = (elem, msg) => {
    elem.firstChild.innerText = msg;
    elem.className = 'fa-copy tooltipped';
  };

  const clipboardSnippets = new ClipboardJS('.clip-button', {
    text: trigger => {
      hideTooltip(trigger);
      return playground_text(trigger.closest('pre'), false);
    },
  });

  Array.from(document.querySelectorAll('.clip-button')).forEach(clipButton => {
    clipButton.addEventListener('mouseout', e => {
      hideTooltip(e.currentTarget);
    });
  });

  clipboardSnippets.on('success', e => {
    e.clearSelection();
    showTooltip(e.trigger, 'Copied!');
  });

  clipboardSnippets.on('error', e => {
    showTooltip(e.trigger, 'Clipboard error!');
  });
})();

// scrollToTop
(() => {
  document.querySelector('.menu-title').addEventListener('click', () => {
    document.scrollingElement.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
