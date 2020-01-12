"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const htmlReplaceRe = /[&<>"]/g;
const htmlReplaceMap = new Map([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;']
]);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const replaceHtmlChar = (ch) => htmlReplaceMap.get(ch);
exports.escapeHtml = (html) => {
    if (htmlReplaceRe.test(html)) {
        return html.replace(htmlReplaceRe, replaceHtmlChar);
    }
    return html;
};
