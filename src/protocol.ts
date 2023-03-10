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
export async function protocolWrite(stream: Writable, data: AbqTypes.ManifestSuccessMessage | AbqTypes.ManifestFailureMessage | AbqTypes.TestResultMessage | AbqTypes.AbqNativeRunnerSpawnedMessage | AbqTypes.InitSuccessMessage): Promise<void> {
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
 * Reads a single message using the standard 4-byte header protocol.
 *
 * Combining this with the `protocolReader` method will have unexpected consequences
 *
 * returns null if all messages have been read / testing is over
 */
export async function protocolRead(stream: Readable, { debug } = { debug: false }): Promise<AbqTypes.InitMessage | AbqTypes.TestCaseMessage | null> {
  return await new Promise(resolve => {
    let messageSize: number | undefined

    // inspired by https://github.com/dex4er/js-promise-readable/blob/master/src/promise-readable.ts#L25
    if (!stream.readable || stream.closed || stream.destroyed) {
      return resolve(null)
    }

    const readableHandler = () => {
      if (messageSize === undefined) {
        const messageSizeBuffer = stream.read(4)
        if (messageSizeBuffer === null) {
          if (debug) {
            console.log('protocolRead:', 'received no data trying to read message size')
          }
          return
        }

        messageSize = messageSizeBuffer.readUInt32BE(0) as number

        if (debug) {
          console.log('protocolRead:', `read message size ${messageSize}`)
        }
      }

      const messageBuffer = stream.read(messageSize)
      if (messageBuffer === null) {
        if (debug) {
          console.log('protocolRead:', 'received no data trying to read message')
        }
        return
      }

      const message = messageBuffer.toString('utf8') as string
      if (debug) {
        console.log('protocolRead:', `read message ${message}`)
      }

      removeListeners()
      resolve(JSON.parse(message))
    }

    const closeHandler = () => {
      removeListeners()
      resolve(null)
    }

    const endHandler = () => {
      removeListeners()
      resolve(null)
    }

    const removeListeners = () => {
      stream.removeListener('close', closeHandler)
      stream.removeListener('end', endHandler)
      stream.removeListener('readable', readableHandler)
    }

    stream.on('close', closeHandler)
    stream.on('end', endHandler)
    stream.on('readable', readableHandler)

    readableHandler()
  })
}

/**
 * Attaches to the `data` handler on a stream, continually reading messages using the standard 4-byte header protocol.
 *
 * When a new message is received, `handler` is called.
 *
 * NOTE: This should not be used in combination with `protocolRead`, as both
 * methods take over the `data` event.
 */
export async function protocolReader(stream: Readable, handler: (message: AbqTypes.InitMessage | AbqTypes.TestCaseMessage) => Promise<void>, { debug } = { debug: false }) {
  let message = await protocolRead(stream, { debug })
  while (message) {
    await handler(message)
    message = await protocolRead(stream, { debug })
  }
}

const CURRENT_PROTOCOL_VERSION_MAJOR = 0
const CURRENT_PROTOCOL_VERSION_MINOR = 2

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
