"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const highlight_js_1 = __importDefault(require("highlight.js"));
const util_1 = require("./util");
const noHighlightRe = /^(no-?highlight|plain|text)$/i;
exports.createHighlightFunc = (preClass, withCaption = true) => (code, lang) => {
    let langName, langCaption;
    let citeTag = '';
    if (withCaption) {
        ;
        [langName, langCaption] = lang.split(':');
        if (langCaption) {
            citeTag = `<cite>${langCaption}</cite>`;
        }
    }
    else {
        langName = lang;
    }
    if (highlight_js_1.default.getLanguage(langName)) {
        const result = highlight_js_1.default.highlight(langName, code);
        return `<pre class="${preClass}">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`;
    }
    else if (noHighlightRe.test(langName)) {
        return `<pre class="${preClass}">${citeTag}<code>${util_1.escapeHtml(code)}</code></pre>`;
    }
    else {
        const result = highlight_js_1.default.highlightAuto(code);
        return `<pre class="${preClass}">${citeTag}<code class="lang-${result.language}">${result.value}</code></pre>`;
    }
};
