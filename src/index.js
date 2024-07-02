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

    const termWrapper = this.api.selection.findParentTag(this.tag, InlineMathTool.CSS);

    if (termWrapper) {
      this.unwrap(termWrapper);
    } else {
      this.wrap(range);
    }
  }

  wrap(range) {
    const selectedText = range.extractContents().textContent.trim();

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
  }

  unwrap(termWrapper) {
    this.api.selection.expandToTag(termWrapper);

    const sel = window.getSelection();
    const range = sel.getRangeAt(0);

    const unwrappedContent = range.extractContents();

    termWrapper.parentNode.removeChild(termWrapper);

    range.insertNode(unwrappedContent);

    sel.removeAllRanges();
    sel.addRange(range);
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
}

export default InlineMathTool;
