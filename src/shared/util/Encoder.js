class Encoder {
  constructor() {
    this.floatBuf = new Float32Array(1);
    this.byteBuf = new Uint8Array(4);
  }

  encode(num) {
    this.floatBuf[0] = num;
    this.byteBuf = new Uint8Array(this.floatBuf.buffer);

    let str = '';
    for (let i = 0; i < this.byteBuf.length; i++) {
      str += String.fromCharCode(this.byteBuf[i]);
    }

    return str;
  }

  decode(str) {
    for (let i = 0; i < 4; i++) {
      this.byteBuf[i] = str.charCodeAt(i);
    }
    this.floatBuf = new Float32Array(this.byteBuf.buffer);
    return this.floatBuf[0];
  }
}

const encoder = new Encoder();
export default encoder;