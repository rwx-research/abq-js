import { Socket } from 'net'
import { AbqConfiguration } from './configuration'
import { protocolWrite, spawnedMessage, SpawnedMessageInterface } from './protocol'

export async function connect(
  abqConfig: AbqConfiguration,
  { adapterName, adapterVersion, testFramework, testFrameworkVersion }: SpawnedMessageInterface): Promise<Socket> {
  if (!abqConfig.enabled) {
    throw new Error('abq must be enabled to connect')
  }

  const socket = new Socket()

  return await new Promise(resolve => {
    socket.connect(
      {
        host: abqConfig.host,
        port: abqConfig.port
      },
      async () => {
        await protocolWrite(socket, spawnedMessage({ adapterName, adapterVersion, testFramework, testFrameworkVersion }))
        resolve(socket)
      }
    )
  })
}
