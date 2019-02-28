import { Node, ExpressionNode, ElementNode, AttributeValue, AttributeNode } from "./types";
import { camelCase, getAttr, toExpression } from './utils';

const selfClosing = new Set(['img', 'link', 'br', 'input']);

export default function rewrite<T extends Node>(node: T): T {
    if (node instanceof ElementNode) {
        return rewriteElement(node) as T;
    }

    if (node instanceof ExpressionNode) {
        return rewriteExpression(node) as T;
    }

    return node;
}

function rewriteElement(node: ElementNode): Node {
    node = /^t-/.test(node.name)
        ? rewriteControl(node)
        : rewriteTag(node);

    const ifAttr = getAttr(node, 'if');
    if (ifAttr) {
        ifAttr.name = 'e:if';
        ifAttr.value = toExpression(ifAttr.value);
    }

    node.attributes.forEach(attr => {
        if (/^on-/.test(attr.name)) {
            // Rewrite event handler
            attr.name = 'on:' + attr.name.slice(3);
            attr.value = toExpression(attr.value);
        }

        attr.value = rewriteAttributeValue(attr.value);
    });

    return node;
}

function rewriteControl(node: ElementNode): ElementNode {
    node.name = node.name.replace(/^t-/, 'e:');
    if (node.open) {
        if (node.name === 'e:if' || node.name === 'e:when') {
            const test = getAttr(node, 'test');
            test.value = toExpression(test.value);
        } else if (node.name === 'e:for-each') {
            const select = getAttr(node, 'select');
            select.value = toExpression(select.value);
        } else if (node.name === 'e:attribute') {
            const name = getAttr(node, 'name');
            node.attributes.length = 0;
            node.attributes.push(new AttributeNode(name.value as string, ''));
        } else if (node.name === 'e:variable') {
            const name = getAttr(node, 'name');
            const select = getAttr(node, 'select');
            node.attributes.length = 0;
            node.attributes.push(new AttributeNode(
                name.value as string,
                new ExpressionNode(select.value as string)
            ));
        }
    }

    return node;
}

function rewriteTag(node: ElementNode): ElementNode {
    const isComponent = node.name.includes('-');

    if (node.open) {
        if (selfClosing.has(node.name)) {
            node.selfClosing = true;
        }

        if (isComponent) {
            node.attributes.forEach(attr => {
                // Camel-case all props
                if (!/^data-/.test(attr.name)) {
                    attr.name = camelCase(attr.name);
                }
                // prop="true" -> prop={true}
                if (typeof attr.value === 'string' && /^true|false|null|\d+$/.test(attr.value)) {
                    attr.value = toExpression(attr.value);
                }
            });
        }
    }

    return node;
}

function rewriteAttributeValue(value: AttributeValue): AttributeValue {
    if (Array.isArray(value)) {
        return value.map(rewriteAttributeValue) as AttributeValue;
    }

    if (value instanceof ExpressionNode) {
        return rewriteExpression(value) as AttributeValue;
    }

    return value;
}

function rewriteExpression(node: ExpressionNode): Node {
    node.value = node.value
        // Replace props: @prop-name -> propName
        .replace(/@([\w-]+)/g, (str, p1) => camelCase(p1))
        // Replace vars: $var-name -> @var-name
        .replace(/\$([\w-]+)/g, (str, p1) => `@${p1}`)
        // Replace state: state('state-name') -> #stateName
        .replace(/\bstate\(['"]([\w-]+)['"]\)/g, (str, p1) => `#${camelCase(p1)}`)

    return node;
}

