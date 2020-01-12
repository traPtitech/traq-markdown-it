"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_it_regexp_1 = __importDefault(require("markdown-it-regexp"));
exports.stampCssPlugin = (md, stamps) => {
    markdown_it_regexp_1.default(/:([\w-_]+?)[:;]/, ([wrappedName, name]) => {
        if (!stamps.includes(name))
            return wrappedName;
        return `<i class="emoji s${wrappedName.endsWith(':') ? 32 : 16} e_${name.replace(/\+/g, '_-plus-_')}" title="${wrappedName}">${wrappedName}</i>`;
    })(md);
};
