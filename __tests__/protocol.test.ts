import { Readable } from "stream";
import { protocolReader } from "../src/protocol";

function toU32BELen(s: string): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(toBytes(s).length, 0);
  return buf;
}

function toBytes(s: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(s);
}

describe("protocolReader", () => {
  async function harness(data: Uint8Array[], expectations) {
    // Test harness:
    //   - write one item in `data` at a time
    //   - each time a message is received by the protocolReader handler, assert
    //     it matches the next expected message

    expect.assertions(expectations.length);

    let writeI = 0;
    let readI = 0;

    let resolver, rejecter;
    const donePromise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    const stream = new (class MyReader extends Readable {
      constructor() {
        super();
      }

      _read(size: number): void {
        if (writeI >= data.length) {
          this.push(null);
        } else {
          this.push(data[writeI]);
          ++writeI;
        }
      }
    })();

    const asserter = async (msgLie) => {
      const msg = msgLie as any as string;
      if (readI >= expectations.length) {
        fail(
          `got more messages (${readI}) than expected to receive (${expectations.length})`
        );
        rejecter();
      } else {
        const expectedMsg = expectations[readI];
        expect(msg).toBe(expectedMsg);
        ++readI;
      }

      if (readI == expectations.length) {
        resolver();
      }
    };

    protocolReader(stream, asserter);

    await donePromise;
  }

  test("read sized message", async () => {
    const msg1 = `"hello world"`;
    const data = [Buffer.concat([toU32BELen(msg1), toBytes(msg1)])];

    const expectations = [msg1].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read sized unicode message", async () => {
    const msg1 = `"©ጷ€🎋"`;
    const data = [Buffer.concat([toU32BELen(msg1), toBytes(msg1)])];

    const expectations = [msg1].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read split sized message", async () => {
    const msg1 = `"hello world"`;
    const data = [toU32BELen(msg1), toBytes(msg1)];

    const expectations = [msg1].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read multiple sized message", async () => {
    const msg1 = `"hello world"`;
    const msg2 = `"mona lisa"`;
    const data = [
      toU32BELen(msg1),
      toBytes(msg1),
      toU32BELen(msg2),
      toBytes(msg2),
    ];

    const expectations = [msg1, msg2].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read split sized message", async () => {
    const msg1 = `"hello world"`;
    const data = [toU32BELen(msg1), toBytes(`"hello `), toBytes(`world"`)];

    const expectations = [msg1].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read split message size and split message", async () => {
    const msg1 = `"hello world"`;
    const msgSizeBuf = toU32BELen(msg1);
    const data = [
      msgSizeBuf.subarray(0, 2),
      msgSizeBuf.subarray(2),
      toBytes(`"hello `),
      toBytes(`world"`),
    ];

    const expectations = [msg1].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read multiple messages delivered in one write", async () => {
    const msg1 = `"hello world"`;
    const msg2 = `"mona lisa"`;

    const chunk = Buffer.concat([
      toU32BELen(msg1),
      toBytes(msg1),
      toU32BELen(msg2),
      toBytes(msg2),
    ]);
    const data = [chunk];

    const expectations = [msg1, msg2].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });

  test("read multiple messages with overlapping write sections", async () => {
    const msg1 = `"hello world"`;
    const msg2 = `"mona lisa"`;

    const chunk1 = Buffer.concat([
      toU32BELen(msg1),
      toBytes(msg1),
      toU32BELen(msg2),
    ]);
    const chunk2 = Buffer.concat([toBytes(msg2)]);
    const data = [chunk1, chunk2];

    const expectations = [msg1, msg2].map((x) => JSON.parse(x));

    await harness(data, expectations);
  });
});
