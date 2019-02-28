import * as assert from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import convert, { PropsModel } from '../src';
import { Token } from '../src/types';

describe('Convert', () => {
    function read(filePath: string): string {
        return readFileSync(resolve(__dirname, filePath), 'utf8');
    }

    it('should convert', () => {
        let model: PropsModel;
        const url = 'samples/ok-message.html'
        const result = convert(read('samples/ok-message.html'), url, token => {
            if (token.type === 'PropsModel') {
                model = token as PropsModel;
            }

            return token as Token;
        });

        assert.deepEqual(model.value, {
            message: null,
            chatId: null,
            unread: false,
            isMine: false,
            isActive: false,
            inChat: false,
            isChatAdmin: false,
            selectMode: false,
            isVisible: false,
            pinned: false,
            proMode: false,
            allowCommands: false
        });

        // writeFileSync(resolve(__dirname, `fixtures/${basename(url)}`), result);
        assert.equal(result, read('fixtures/ok-message.html'));
    });
});
