import expression, { EXPRESSION_START } from './expression';
import { ElementNode, AttributeNode, AttributeValue, ExpressionNode, BaseAttributeValue } from '../types';
import { isWhiteSpace, isQuote, eatQuoted, isAlpha, isNumber, isSpace } from './utils';
import Scanner from '../scanner';

export const TAG_START = 60; // <
export const TAG_END = 62; // >
export const TAG_CLOSE = 47; // /
export const ATTR_DELIMITER = 61; // =
export const NAMESPACE_DELIMITER = 58; // :
export const DASH = 45; // -
export const DOT = 46; // .
export const UNDERSCORE = 95; // _

const exprStart = String.fromCharCode(EXPRESSION_START);

/**
 * Consumes tag from current stream location, if possible
 */
export default function tag(scanner: Scanner): ElementNode {
    return openTag(scanner) || closeTag(scanner);
}

/**
 * Consumes open tag from given stream
 */
export function openTag(scanner: Scanner): ElementNode {
    const pos = scanner.pos;
    if (scanner.eat(TAG_START)) {
        const name = ident(scanner);
        if (name) {
            const attributes = consumeAttributes(scanner);
            const selfClosing = scanner.eat(TAG_CLOSE);

            if (!scanner.eat(TAG_END)) {
                throw scanner.error('Expected tag closing brace');
            }

            return scanner.addLoc(new ElementNode(name, true, attributes, selfClosing), pos);
        }
    }

    scanner.pos = pos;
}

/**
 * Consumes close tag from given stream
 */
export function closeTag(scanner: Scanner): ElementNode {
    const pos = scanner.pos;
    if (scanner.eat(TAG_START) && scanner.eat(TAG_CLOSE)) {
        const name = ident(scanner);
        if (name) {
            if (!scanner.eat(TAG_END)) {
                throw scanner.error('Expected tag closing brace');
            }

            return scanner.addLoc(new ElementNode(name, false));
        }

        throw scanner.error('Unexpected character');
    }

    scanner.pos = pos;
}

/**
 * Check if given character can be used as a name start of tag name or attribute
 */
export function nameStartChar(ch: number): boolean {
    return isAlpha(ch) || ch === UNDERSCORE || ch === NAMESPACE_DELIMITER;
}

/**
 * Check if given character can be used as a tag name
 */
function nameChar(ch: number): boolean {
    return nameStartChar(ch) || isNumber(ch) || ch === DASH || ch === DOT;
}

/**
 * Returns `true` if valid XML identifier was consumed. If succeeded, sets stream
 * range to consumed data
 */
function ident(scanner: Scanner): string {
    const start = scanner.pos;
    if (scanner.eat(nameStartChar)) {
        scanner.start = start;
        scanner.eatWhile(nameChar);

        return scanner.current();
    }
}

/**
 * Consumes attributes from current stream start
 */
function consumeAttributes(scanner: Scanner): AttributeNode[] {
    const attributes: AttributeNode[] = [];
    let attr: AttributeNode;
    while (!scanner.eof()) {
        scanner.eatWhile(isSpace);

        if (attr = attribute(scanner)) {
            attributes.push(attr);
        } else if (!scanner.eof() && !isTerminator(scanner.peek())) {
            throw scanner.error('Unexpected attribute name');
        } else {
            break;
        }
    }

    return attributes;
}

/**
 * Consumes attribute from current stream location
 */
function attribute(scanner: Scanner): AttributeNode {
    const start = scanner.pos;
    const name = ident(scanner);
    if (name) {
        let value: AttributeValue = null;

        if (scanner.eat(ATTR_DELIMITER)) {
            if (!(value = attributeValue(scanner))) {
                throw scanner.error('Expecting attribute value');
            }
        }

        return scanner.addLoc(new AttributeNode(name, value), start);
    }
}

/**
 * Consumes attribute value from current stream location
 */
function attributeValue(scanner: Scanner): AttributeValue {
    const expr = expression(scanner);
    if (expr) {
        return expr;
    }

    const start = scanner.pos;

    if (eatQuoted(scanner)) {
        // Check if it’s interpolated value, e.g. "foo {bar}"
        const raw = scanner.current();
        if (raw.includes(exprStart)) {
            const attrExpression = attributeValueExpression(scanner.limit(scanner.start + 1, scanner.pos - 1));
            if (attrExpression.length === 1) {
                return attrExpression[0];
            }

            return attrExpression;
        }

        return raw.slice(1, -1);
    }

    if (scanner.eatWhile(isUnquoted)) {
        scanner.start = start;
        return scanner.current();
    }
}

/**
 * Parses interpolated attribute value from current scanner context
 */
function attributeValueExpression(scanner: Scanner): BaseAttributeValue[] {
    let start = scanner.start;
    let pos = scanner.start;
    let expr: ExpressionNode;
    const items: BaseAttributeValue[] = [];

    while (!scanner.eof()) {
        pos = scanner.pos;
        if (expr = expression(scanner)) {
            if (pos !== start) {
                items.push(scanner.substring(start, pos));
            }
            items.push(scanner.addLoc(expr, start));
            start = scanner.pos;
        } else {
            scanner.pos++;
        }
    }

    if (start !== scanner.pos) {
        items.push(scanner.substring(start, scanner.pos));
    }

    return items;
}

/**
 * Check if given code is tag terminator
 */
function isTerminator(code: number): boolean {
    return code === TAG_END || code === TAG_CLOSE;
}

/**
 * Check if given character code is valid unquoted value
 */
function isUnquoted(code: number): boolean {
    return !isNaN(code) && !isQuote(code) && !isWhiteSpace(code)
        && !isTerminator(code) && code !== ATTR_DELIMITER && code !== EXPRESSION_START;
}
