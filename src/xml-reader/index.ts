import Scanner from "../scanner";
import { toCharCodes, eatSection } from "./utils";
import { SectionNode, Token } from "../types";
import tag from './tag';
import text from './text';
import expression from './expression';

type ParserCallback = (token: Token) => void;

const cdataOpen = toCharCodes('<![CDATA[');
const cdataClose = toCharCodes(']]>');
const commentOpen = toCharCodes('<!--');
const commentClose = toCharCodes('-->');
const piOpen = toCharCodes('<?');
const piClose = toCharCodes('?>');

export default function parse(str: string, url: string, callback: ParserCallback) {
    const scanner = new Scanner(str, url);
    let token: Token;
    while (!scanner.eof()) {
        token = ignored(scanner) || tag(scanner) || expression(scanner) || text(scanner);
        if (token && callback) {
            callback(token);
        } else {
            throw scanner.error('Unexpected token');
        }
    }
}

/**
 * Consumes XML sections that can be safely ignored by Endorphin
 */
function ignored(scanner: Scanner): SectionNode {
    return eatSection(scanner, cdataOpen, cdataClose)
        || eatSection(scanner, piOpen, piClose)
        || eatSection(scanner, commentOpen, commentClose, true);
}
