import { AttributeValue, ExpressionNode, ElementNode, AttributeNode } from "./types";

export function camelCase(str: string): string {
    return str.replace(/-([a-z0-9])/ig, (str, p1) => p1.toUpperCase());
}

export function toExpression(value: AttributeValue): AttributeValue {
    return typeof value === 'string' ? new ExpressionNode(value) : value;
}

export function getAttr(node: ElementNode, name: string): AttributeNode {
    return node.attributes.find(attr => attr.name === name);
}
