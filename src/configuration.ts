// package.json is outside of TypeScript rootDir.

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
}

interface DisabledAbq {
  enabled: false
  experiments: Record<string, never>
  host: undefined
  port: undefined
  shouldGenerateManifest: false
}

export type AbqConfiguration = EnabledAbq | DisabledAbq

let abq: AbqConfiguration

if (host && typeof port !== 'undefined') {
  abq = {
    enabled: true,
    experiments: {},
    host,
    port,
    shouldGenerateManifest: !!process.env.ABQ_GENERATE_MANIFEST
  } as EnabledAbq
} else {
  abq = {
    enabled: false,
    experiments: {},
    host: undefined,
    port: undefined,
    shouldGenerateManifest: false
  } as DisabledAbq
}

export function getAbqConfiguration(): AbqConfiguration {
  return abq
}
