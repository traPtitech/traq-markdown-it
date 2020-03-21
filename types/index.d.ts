import MarkdownIt from 'markdown-it';
import MarkdownItMark from 'markdown-it-mark';
import spoiler from '@traptitech/markdown-it-spoiler';
import stamp from './stamp';
import json from './json';
import katex from '@traptitech/markdown-it-katex';
import { Store } from './Store';
export { Store } from './Store';
interface MarkdownItE extends MarkdownIt {
    use<T extends Array<unknown> = unknown[]>(plugin: (md: MarkdownIt, ...params: T) => void, ...params: T): MarkdownItE;
}
export default class {
    readonly md: MarkdownItE;
    constructor(store: Store, whitelist?: string[]);
    setPlugin(store: Store, whitelist: string[]): void;
    setRendererRule(): void;
    render(text: string): string;
    renderInline(text: string): string;
}
export { createHighlightFunc } from './highlight';
export declare const markPlugin: typeof MarkdownItMark;
export declare const spoilerPlugin: typeof spoiler;
export declare const stampPlugin: typeof stamp;
export declare const jsonPlugin: typeof json;
export declare const katexPlugin: typeof katex;
export { useContainer } from './container';
export { stampCssPlugin } from './stampCss';
