import katex from 'katex';
import 'katex/dist/katex.min.css';

import './index.css';

class InlineMathTool {
  static get CSS() {
    return 'afl-inline-latex';
  }

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      latex: {
        span: {
          class: InlineMathTool.CSS,
        },
        contenteditable: true,
      },
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
    const latex = fragment.querySelectorAll(`span.afl-inline-latex`);
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
    modal.classList.add('latex-modal');

    const span = latex.querySelector('span.afl-inline-latex');
    const textarea = document.createElement('textarea');
    textarea.value = span.innerHTML || '';
    modal.appendChild(textarea);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    modal.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    modal.appendChild(cancelButton);

    saveButton.addEventListener('click', () => {
      span.innerText = textarea.value;
      const allSpans = latex.querySelectorAll('span');
      allSpans.forEach((latexSpan) => {
        if (!latexSpan.classList.contains('afl-inline-latex')) {
          latexSpan.remove();
        }
      });
      const formulaElem = document.createElement('span');
      formulaElem.innerText = textarea.value;

      latex.appendChild(formulaElem);
      this.renderFormula(formulaElem);
      document.body.removeChild(modal);
    });

    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
  }

  addEventListeners(latexTag) {
    if (!latexTag.hasAttribute('data-listener-added')) {
      latexTag.addEventListener('click', () => {
        this.showModal(latexTag);
      });
      latexTag.setAttribute('data-listener-added', 'true'); // Mark that the listener has been added
    }
  }

  addEventListenersToAll() {
    document.querySelectorAll(this.tag).forEach((latexTag) => {
      this.addEventListeners(latexTag);
    });
  }
}

export default InlineMathTool;
