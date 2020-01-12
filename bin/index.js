"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/camelcase */
const markdown_it_1 = __importDefault(require("markdown-it"));
const markdown_it_mark_1 = __importDefault(require("markdown-it-mark"));
const markdown_it_spoiler_1 = __importDefault(require("markdown-it-spoiler"));
const stamp_1 = __importStar(require("./stamp"));
const json_1 = __importDefault(require("./json"));
const markdown_it_katex_1 = __importDefault(require("@traPtitech/markdown-it-katex"));
const katex_1 = __importDefault(require("katex"));
const markdown_it_link_attributes_1 = __importDefault(require("markdown-it-link-attributes"));
const markdown_it_image_filter_1 = __importDefault(require("markdown-it-image-filter"));
const highlight_1 = require("./highlight");
const domain_whitelist_1 = __importDefault(require("./default/domain_whitelist"));
class default_1 {
    constructor(store, whitelist = domain_whitelist_1.default) {
        this.md = new markdown_it_1.default({
            breaks: true,
            linkify: true,
            highlight: highlight_1.createHighlightFunc('traq-code traq-lang')
        });
        this.setRendererRule();
        this.setPlugin(store, whitelist);
    }
    setPlugin(store, whitelist) {
        this.md
            .use(markdown_it_mark_1.default)
            .use(markdown_it_spoiler_1.default, true)
            .use(json_1.default, store)
            .use(stamp_1.default, store)
            .use(markdown_it_katex_1.default, {
            katex: katex_1.default,
            output: 'html',
            maxSize: 100,
            blockClass: 'is-scroll'
        })
            .use(markdown_it_link_attributes_1.default, {
            attrs: {
                target: '_blank',
                rel: 'nofollow noopener noreferrer'
            }
        })
            .use(markdown_it_image_filter_1.default(whitelist, { httpsOnly: true }));
    }
    setRendererRule() {
        this.md.renderer.rules.table_open = () => '<table class="is-scroll">';
        this.md.renderer.rules.blockquote_open = () => '<blockquote class="is-scroll">';
        this.md.renderer.rules.bullet_list_open = () => '<ul class="is-scroll">';
        this.md.renderer.rules.ordered_list_open = () => '<ol class="is-scroll">';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blockState = this.md.block.State;
        blockState.prototype.skipEmptyLines = function skipEmptyLines(from) {
            for (let max = this.lineMax; from < max; from++) {
                if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
                    break;
                }
                this.push('hardbreak', 'br', 0);
            }
            return from;
        };
    }
    render(text) {
        return this.md.render(text, {});
    }
    renderInline(text) {
        const parsed = this.md.parseInline(text, {});
        const tokens = parsed[0].children;
        const rendered = [];
        for (const token of tokens) {
            if (token.type === 'regexp-0') {
                // stamp
                rendered.push(stamp_1.renderStamp(token.meta.match));
            }
            else if (token.type === 'spoiler_open') {
                rendered.push('<span class="spoiler">');
            }
            else if (token.type === 'spoiler_close') {
                rendered.push('</span>');
            }
            else if (token.type === 'softbreak') {
                // newline
                rendered.push(' ');
            }
            else {
                rendered.push(this.md.utils.escapeHtml(token.content));
            }
        }
        return rendered.join('');
    }
}
exports.default = default_1;
var highlight_2 = require("./highlight");
exports.createHighlightFunc = highlight_2.createHighlightFunc;
exports.markPlugin = markdown_it_mark_1.default;
exports.spoilerPlugin = markdown_it_spoiler_1.default;
exports.stampPlugin = stamp_1.default;
exports.jsonPlugin = json_1.default;
exports.katexPlugin = markdown_it_katex_1.default;
var container_1 = require("./container");
exports.useContainer = container_1.useContainer;
var stampCss_1 = require("./stampCss");
exports.stampCssPlugin = stampCss_1.stampCssPlugin;
