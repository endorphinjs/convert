export interface SourceLocation {
    source?: string | null;
    start: Position;
    end: Position;
}

export interface Position {
    line: number; // >= 1
    column: number; // >= 0
    pos: number; // >= 0
}

export class Node {
    readonly type: string;
    loc?: Position;
}

export class TextNode extends Node {
    type = 'TextNode';
    constructor(readonly value: string) {
        super();
    }
}

export type BaseAttributeValue = string | ExpressionNode;
export type AttributeValue = BaseAttributeValue | BaseAttributeValue[] | null;

export class AttributeNode extends Node {
    type = 'AttributeNode';
    constructor(public name: string, public value: AttributeValue) {
        super();
    }
}

export class ElementNode extends Node {
    type = 'ElementNode';
    constructor(public name: string, readonly open: boolean, readonly attributes: AttributeNode[] = [], public selfClosing: boolean = false) {
        super();
    }
}

export class ExpressionNode extends Node {
    type = 'ExpressionNode';
    constructor(public value: string) {
        super();
    }
}

export class SectionNode extends Node {
    type = 'SectionNode';
    constructor(public value: string) {
        super();
    }
}

export type Token = SectionNode | TextNode | ElementNode | TextNode;
