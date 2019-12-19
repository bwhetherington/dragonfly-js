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

  parseTo(type, end) {
    let value = "";
    let ch;
    while ((ch = this.getChar()) !== null) {
      this.consumeChar();
      if (ch === end) {
        return {
          type,
          value
        };
      } else {
        value += ch;
      }
    }
    return null;
  }

  nextToken() {
    let ch = this.getChar();
    switch (ch) {
      case "*":
        this.consumeChar();
        return this.parseTo("BOLD", "*");
      case "_":
        this.consumeChar();
        return this.parseItalics("ITALICS", "_");
      case "~":
        this.consumeChar();
        return this.parseStrikethrough("STRIKETHROUGH", "~");
      case null:
        return null;
      default:
        let str = "";
        while ((ch = this.getChar()) !== null) {
          this.consumeChar();
          str += ch;
        }
        return {
          type: "TEXT",
          value: str
        };
    }
  }

  parseExpression() {
    let tok;
    while ((tok = this.nextToken()) !== null) {
      if (tok.type === "TEXT") {
        return tok.value;
      } else if (tok.type === "OPENING_TAG") {
      }
    }
  }
}

const parser = new MessageParser("*_This is bold_* foo");
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
