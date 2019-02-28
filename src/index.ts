import parseXml from './xml-reader';
import rewrite from './rewrite';
import stringify from './stringify';
import { Token, ElementNode, TextNode } from './types';
import { getAttr, camelCase } from './utils';

type ConvertCallback = (token: Token | PropsModel) => Token;

export interface PropsModel {
    type: 'PropsModel',
    value: {
        [key: string]: any
    }
}

export default function convert(template: string, url?: string, callback?: ConvertCallback): string {
    let result = '';

    const props: PropsModel = {
        type: 'PropsModel',
        value: {}
    };
    let ctxProp: string;
    let ctxValue: any;
    const propsStack: ElementNode[] = [];

    parseXml(template, url, token => {
        token = rewrite(token);

        if (!token) {
            return;
        }

        if (callback) {
            token = callback(token);
        }

        if (token instanceof ElementNode && token.name === 'model') {
            if (token.open) {
                propsStack.push(token);
            } else {
                propsStack.pop();
                callback && callback(props);
            }
        } else if (propsStack.length) {
            if (token instanceof ElementNode && token.name === 'key') {
                if (token.open) {
                    ctxProp = camelCase(getAttr(token, 'name').value as string);
                    ctxValue = null;
                    propsStack.push(token);
                } else {
                    const decl = propsStack.pop();

                    // Convert default value to native type
                    const typeAttr = getAttr(decl, 'type');
                    const type = typeAttr && typeAttr.value as string;
                    if (type === 'number') {
                        if (ctxValue) {
                            ctxValue = parseFloat(ctxValue);
                        }
                    } else if (type === 'boolean') {
                        ctxValue = ctxValue === 'true' ? true : false;
                    }

                    props.value[ctxProp] = ctxValue;
                    ctxProp = null;
                }
            } else if (token instanceof TextNode && ctxProp) {
                ctxValue = token.value;
            }
        } else {
            result += stringify(token);
        }
    });

    return result;
}
