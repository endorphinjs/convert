import { ExpressionNode } from '../types';
import { eatPair } from './utils';
import Scanner from '../scanner';

export const EXPRESSION_START = 123; // {
export const EXPRESSION_END = 125; // }

/**
 * Consumes expression from current stream location
 */
export default function expression(scanner: Scanner): ExpressionNode {
    if (eatPair(scanner, EXPRESSION_START, EXPRESSION_END)) {
        scanner.start++;
        const begin = scanner.start;
        const end = scanner.pos - 1;
        let value = scanner.substring(begin, end);

        // Trim double braces from old expressions: `{{ expr }}`
        if (value.charCodeAt(0) === EXPRESSION_START) {
            value = value.slice(1, -1);
        }

        return scanner.addLoc(new ExpressionNode(value), begin);
    }
}
