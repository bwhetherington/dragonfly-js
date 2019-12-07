const WHITESPACE_REGEX = /\s+/;

const isWhitespace = str => WHITESPACE_REGEX.test(str);

class MessageParser {
  constructor(input) {
    this.input = input;
    this.cursor = 0;
  }

  nextChar() {
    const ch = this.input[this.cursor] || null;
    this.cursor += 1;
    return ch;
  }

  parseOpeningTag() {
    let str = '';
    let ch = null;
    while ((ch = this.getChar()) !== null) {
      this.consumeChar();
      if (!isWhitespace(ch)) {
        if (ch === '>') {
          // Found end
          return {
            type: 'OPENING_TAG',
            value: str
          };
        } else {
          str += ch;
        }
      }
    }
    return null;
  }

  parseClosingTag() {
    let str = '';
    let ch = this.getChar();
    if (ch === '/') {
      this.consumeChar();
      while ((ch = this.getChar()) !== null) {
        this.consumeChar();
        if (!isWhitespace(ch)) {
          if (ch === '>') {
            // Found end
            return {
              type: 'CLOSING_TAG',
              value: str
            };
          } else {
            str += ch;
          }
        }
      }
    }
    return null;
  }

  peekChar() {
    return this.input[this.cursor + 1] || null;
  }

  unread(ch) {
    this.unreadChars.push(ch);
  }

  getChar() {
    return this.input[this.cursor] || null;
  }

  consumeChar() {
    this.cursor += 1;
  }

  nextToken() {
    let ch = this.getChar();
    if (ch === '<') {
      this.consumeChar();
      ch = this.getChar();
      if (ch === '/') {
        return this.parseClosingTag();
      } else {
        return this.parseOpeningTag();
      }
    } else {
      let str = '';
      while ((ch = this.getChar()) !== null) {
        if (ch !== '<') {
          this.consumeChar();
          str += ch;
        } else {
          break;
        }
      }
      if (str.length > 0) {
        return {
          type: 'TEXT',
          value: str
        };
      } else {
        return null;
      }
    }
  }

  parseExpression() {
    let tok;
    while ((tok = this.nextToken()) !== null) {
      if (tok.type === 'TEXT') {
        return tok.value;
      } else if (tok.type === 'OPENING_TAG') {

      }
    }
  }
}

const parser = new MessageParser('<foo>hello world</foo>');
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());
console.log(parser.nextToken());

// export default MessageParser;