// package.json is outside of TypeScript rootDir.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: VERSION } = require('../package.json')

const abqSocket = process.env.ABQ_SOCKET
let host, portString, port
if (abqSocket) {
  [host, portString] = abqSocket.split(':')
  port = parseInt(portString, 10)
}

interface EnabledAbq {
  enabled: true
  experiments: Record<string, never>
  host: string
  port: number
  shouldGenerateManifest: boolean
  shouldHideNativeOutput: boolean
  shouldRunIndividualTests: boolean
}

interface DisabledAbq {
  enabled: false
  experiments: Record<string, never>
  host: undefined
  port: undefined
  shouldGenerateManifest: false
  shouldHideNativeOutput: false
  shouldRunIndividualTests: false
}

let abq: EnabledAbq | DisabledAbq

if (host && typeof port !== 'undefined') {
  abq = {
    enabled: true,
    experiments: {},
    host,
    port,
    shouldGenerateManifest: !!process.env.ABQ_GENERATE_MANIFEST,
    shouldHideNativeOutput: !!process.env.ABQ_HIDE_NATIVE_OUTPUT,
    shouldRunIndividualTests: !!process.env.ABQ_RUN_INDIVIDUAL_TESTS
  } as EnabledAbq
} else {
  abq = {
    enabled: false,
    experiments: {},
    host: undefined,
    port: undefined,
    shouldGenerateManifest: false,
    shouldHideNativeOutput: false,
    shouldRunIndividualTests: false
  } as DisabledAbq
}

export function getAbqConfiguration(): EnabledAbq | DisabledAbq {
  return abq
}
