import katex from 'katex';
import 'katex/dist/katex.min.css';

import './index.css';

class InlineMathTool {
  static get CSS() {
    return 'afl-inline-latex';
  }

  static get EVENT_LISTENER() {
    return 'im-has-data-listener';
  }

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      latex: {
        contenteditable: true,
        style: true,
      },
      span: function (el) {
        return (
          el.classList.contains('katex') ||
          el.classList.contains('katex-mathml') ||
          el.classList.contains('katex-html') ||
          el.classList.contains('base') ||
          el.classList.contains('strut') ||
          el.classList.contains('mord') ||
          el.classList.contains('afl-inline-latex') ||
          el.classList.length === 0
        );
      },
      math: true,
      semantics: true,
      mrow: true,
      mi: true,
    };
  }

  static get shortcut() {
    return 'CMD+M';
  }

  static get title() {
    return 'LaTeX';
  }

  constructor({ api, data }) {
    this.api = api;
    this.button = null;
    this.tag = 'LATEX';
    this.data = data;

    this.iconClasses = {
      base: this.api.styles.inlineToolButton,
      active: this.api.styles.inlineToolButtonActive,
    };

    this.addEventListenersToAll();
  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('latex-tool-button');
    this.button.classList.add(this.iconClasses.base);

    return this.button;
  }

  surround(range) {
    if (!range) {
      return;
    }

    const termWrapper = this.api.selection.findParentTag(this.tag);

    const fragment = range.cloneContents();
    const latex = fragment.querySelectorAll(`span.${InlineMathTool.CSS}`);
    if (latex.length > 1) {
      return;
    } else if (latex.length == 0) {
      this.wrap(range);
    } else if (termWrapper) {
      this.showModal(termWrapper);
    }
  }

  wrap(range) {
    const selectedText = range.extractContents().textContent.trim();

    if (selectedText.length < 1) {
      return;
    }

    const wrapper = document.createElement(this.tag);
    wrapper.style.display = 'inline-block';
    wrapper.setAttribute('contenteditable', 'false');

    const latexElem = document.createElement('span');
    latexElem.classList.add(InlineMathTool.CSS);
    latexElem.style.display = 'none';
    latexElem.innerText = selectedText;

    const formulaElem = document.createElement('span');
    formulaElem.innerText = selectedText;

    wrapper.appendChild(latexElem);
    wrapper.appendChild(formulaElem);

    range.insertNode(wrapper);

    this.api.selection.expandToTag(wrapper);

    this.renderFormula(formulaElem);
    this.addEventListeners(wrapper);
  }

  checkState() {
    const termTag = this.api.selection.findParentTag(this.tag, InlineMathTool.CSS);

    this.button.classList.toggle(this.iconClasses.active, !!termTag);
  }

  renderFormula(element) {
    try {
      const formula = element.innerText || '';
      katex.render(formula, element, {
        throwOnError: false,
      });
    } catch (error) {
      element.textContent = error.message;
    }
  }

  showModal(latex) {
    // Check if a modal already exists
    if (document.querySelector('.latex-modal')) {
      return;
    }
    const modal = document.createElement('div');
    modal.classList.add('latex-modal-overlay');

    const content = document.createElement('div');
    content.classList.add('latex-modal-content');

    const closeButton = document.createElement('button');
    closeButton.classList.add('latex-modal-content-button-close');
    closeButton.textContent = '✖';
    content.appendChild(closeButton);

    const span = latex.querySelector('span.afl-inline-latex');
    const textarea = document.createElement('textarea');
    textarea.classList.add('latex-modal-content-textarea');
    textarea.value = span.innerHTML || '';
    textarea.rows = '5';
    content.appendChild(textarea);

    const saveButton = document.createElement('button');
    saveButton.classList.add('latex-modal-content-button');
    saveButton.textContent = 'Save';
    content.appendChild(saveButton);

    modal.appendChild(content);

    saveButton.addEventListener('click', () => {
      span.innerText = textarea.value;
      const allSpans = latex.querySelectorAll('span');
      allSpans.forEach((latexSpan) => {
        if (!latexSpan.classList.contains(InlineMathTool.CSS)) {
          latexSpan.remove();
        }
      });
      const formulaElem = document.createElement('span');
      formulaElem.innerText = textarea.value;

      latex.appendChild(formulaElem);
      this.renderFormula(formulaElem);
      document.body.removeChild(modal);
    });

    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
  }

  addEventListeners(latexTag) {
    if (!latexTag.hasAttribute(InlineMathTool.EVENT_LISTENER)) {
      latexTag.addEventListener('click', () => {
        this.showModal(latexTag);
      });
      latexTag.setAttribute(InlineMathTool.EVENT_LISTENER, 'true');
    }
  }

  addEventListenersToAll() {
    document.querySelectorAll(this.tag).forEach((latexTag) => {
      this.addEventListeners(latexTag);
    });
  }
}

export default InlineMathTool;
