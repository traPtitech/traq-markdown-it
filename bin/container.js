"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_it_container_1 = __importDefault(require("markdown-it-container"));
const defaultLabels = ['success', 'info', 'warning', 'danger'];
exports.useContainer = (md, labels = defaultLabels) => {
    labels.forEach(label => {
        md.use(markdown_it_container_1.default, label);
    });
};
