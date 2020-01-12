"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_it_json_1 = __importDefault(require("markdown-it-json"));
let store;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (data) => {
    if (typeof data['type'] !== 'string' ||
        typeof data['raw'] !== 'string' ||
        typeof data['id'] !== 'string') {
        return false;
    }
    if (data['type'] === 'user' && store.getMember(data['id'])) {
        return true;
    }
    else if (data['type'] === 'channel' && store.getChannel(data['id'])) {
        return true;
    }
    else if (data['type'] === 'group' && store.getGroup(data['id'])) {
        return true;
    }
    else if (data['type'] === 'file' || data['type'] === 'message') {
        return true;
    }
    return false;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transform = (state, data) => {
    const attributes = [];
    const meta = { type: data['type'], data: '' };
    if (data['type'] === 'user' && store.getMember(data['id'])) {
        attributes.push(['href', `javascript:openUserModal('${data['id']}')`]);
        meta.data = data['id'];
        if (data['id'] === store.getMe().userId) {
            attributes.push([
                'class',
                'message-user-link-highlight message-user-link'
            ]);
        }
        else {
            attributes.push(['class', 'message-user-link']);
        }
        let t = state.push('traq_extends_link_open', 'a', 1);
        t.attrs = attributes;
        t.meta = meta;
        t = state.push('text', '', 0);
        t.content = data['raw'];
        state.push('traq_extends_link_close', 'a', -1);
    }
    else if (data['type'] === 'channel' && store.getChannel(data['id'])) {
        attributes.push([
            'href',
            `javascript:changeChannel('${store.getChannelPath(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            store.getChannel(data['id']).channelId)}')`
        ]);
        attributes.push(['class', 'message-channel-link']);
        meta.data = data['raw'];
        let t = state.push('traq_extends_link_open', 'a', 1);
        t.attrs = attributes;
        t.meta = meta;
        t = state.push('text', '', 0);
        t.content = data['raw'];
        state.push('traq_extends_link_close', 'a', -1);
    }
    else if (data['type'] === 'group' && store.getGroup(data['id'])) {
        attributes.push(['href', `javascript:openGroupModal('${data['id']}')`]);
        if (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        store
            .getGroup(data['id'])
            .members.filter(userId => userId === store.getMe().userId).length > 0) {
            attributes.push([
                'class',
                'message-group-link-highlight message-group-link'
            ]);
        }
        else {
            attributes.push(['class', 'message-group-link']);
        }
        meta.data = data['id'];
        let t = state.push('traq_extends_link_open', 'a', 1);
        t.attrs = attributes;
        t.meta = meta;
        t = state.push('text', '', 0);
        t.content = data['raw'];
        state.push('traq_extends_link_close', 'a', -1);
    }
    else if (data['type'] === 'file') {
        meta.data = data['id'];
        let t = state.push('traq_extends_link_open', 'a', 1);
        t.attrs = [
            ['href', `/api/1.0/files/${data['id']}`],
            ['download', data['id']]
        ];
        t.meta = meta;
        t = state.push('text', '', 0);
        t.content = data['raw'];
        state.push('traq_extends_link_close', 'a', -1);
    }
    else {
        state.push('traq_extends_plain_open', 'a', 1);
        const t = state.push('text', '', 0);
        t.content = data['raw'];
        state.push('traq_extends_plain_close', 'a', -1);
    }
};
function messageExtendsPlugin(md, _store) {
    store = _store;
    markdown_it_json_1.default(validate, transform)(md);
}
exports.default = messageExtendsPlugin;
