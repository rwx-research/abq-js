import { Readable, Writable } from 'stream'
import * as AbqTypes from './types'

/*
 * Communication between abq TCP sockets the following protocol:
 *   - The first 4 bytes an unsigned 32-bit integer (big-endian) representing
 *     the size of the rest of the message.
 *   - The rest of the message is a JSON-encoded payload.
 */

/**
 * Writes a message using the standard 4-byte header protocol.
 */
export async function protocolWrite(stream: Writable, data: AbqTypes.ManifestMessage | AbqTypes.TestResultMessage | AbqTypes.AbqNativeRunnerSpawnedMessage | AbqTypes.InitSuccessMessage): Promise<undefined> {
  const buffer = Buffer.from(JSON.stringify(data), 'utf8')
  const protocolBuffer = Buffer.alloc(4 + buffer.length)
  protocolBuffer.writeUInt32BE(buffer.length, 0)
  buffer.copy(protocolBuffer, 4)
  return await new Promise((resolve, reject) => {
    stream.write(protocolBuffer, err => {
      if (err) {
        reject(err)
      } else {
        resolve(undefined)
      }
    })
  })
}

/**
 * Reads messages using the standard 4-byte header protocol.
 *
 * When a new message is received, `handler` is called.
 */
export function protocolReader(stream: Readable, handler: (message: AbqTypes.InitMessage | AbqTypes.TestCaseMessage) => Promise<undefined>, { debug } = { debug: false }) {
  let buffer = Buffer.from('')
  let messageSize: number | undefined

  stream.on('data', async chunk => {
    if (debug) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log('READER:', `Received chunk: ${chunk.toString()}`)
    }

    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    buffer = Buffer.concat([buffer, chunk], buffer.length + chunk.length)
    if (buffer.length >= 4) {
      messageSize = buffer.readUInt32BE(0)
    }
    if (messageSize && buffer.length >= messageSize + 4) {
      // We now know the whole message is available; get it.
      const currentMessage = buffer.toString('utf8', 4, 4 + messageSize)

      // There might be an additional message waiting for us behind the one we
      // just parsed. Reset the buffer to this new message.
      const newBuffer = buffer.subarray(4 + messageSize)
      buffer = newBuffer

      await handler(JSON.parse(currentMessage))
    } else if (debug) {
      console.log('READER:', 'Incomplete chunk, waiting for next chunk')
    }
  })
}

const CURRENT_PROTOCOL_VERSION_MAJOR = 0
const CURRENT_PROTOCOL_VERSION_MINOR = 1

export interface SpawnedMessageInterface {
  adapterName: string
  adapterVersion: string
  testFramework: string
  testFrameworkVersion: string
}
export function spawnedMessage({ adapterName, adapterVersion, testFramework, testFrameworkVersion }: SpawnedMessageInterface): AbqTypes.AbqNativeRunnerSpawnedMessage {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const protocol_version: AbqTypes.ProtocolVersion = {
    type: 'abq_protocol_version',
    major: CURRENT_PROTOCOL_VERSION_MAJOR,
    minor: CURRENT_PROTOCOL_VERSION_MINOR
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const runner_specification: AbqTypes.NativeRunnerSpecification = {
    type: 'abq_native_runner_specification',
    name: adapterName,
    version: adapterVersion,
    test_framework: testFramework,
    test_framework_version: testFrameworkVersion,
    language: 'javascript',
    language_version: process.version,
    host: 'nodejs ' + process.version
  }

  return {
    type: 'abq_native_runner_spawned',
    protocol_version,
    runner_specification
  }
}

export function initSuccessMessage(): AbqTypes.InitSuccessMessage {
  return {}
}
