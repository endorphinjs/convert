import { TextNode, SectionNode, ExpressionNode, ElementNode, Node, AttributeNode } from './types';

export default function stringify<T extends Node | string>(node: T): string {
    if (node == null) {
        return '';
    }

    if (typeof node === 'string') {
        return node;
    }

    if (node instanceof ExpressionNode) {
        return `{${node.value}}`;
    }

    if (node instanceof TextNode || node instanceof SectionNode) {
        return node.value;
    }

    if (node instanceof AttributeNode) {
        if (node.value == null) {
            return node.name;
        }

        if (Array.isArray(node.value)) {
            return `${node.name}="${node.value.map(stringify).join('')}"`;
        }

        const value = typeof node.value === 'string' ? `"${node.value}"` : stringify(node.value);
        return `${node.name}=${value}`;
    }

    if (node instanceof ElementNode) {
        return stringifyElement(node);
    }

    throw new Error(`Unknown node: ${node}`);
}

function stringifyElement(node: ElementNode): string {
    if (node.open) {
        const attrs = node.attributes.map(attr => ` ${stringify(attr)}`).join('');
        return `<${node.name}${attrs}${node.selfClosing ? ' /' : ''}>`;
    }

    return `</${node.name}>`;
}
