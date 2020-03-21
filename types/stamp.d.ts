import MarkdownIt from 'markdown-it';
import { Store } from './Store';
export declare const renderStamp: (match: RegExpMatchArray) => string;
export default function stampPlugin(md: MarkdownIt, _store: Store, _baseUrl?: string): void;
