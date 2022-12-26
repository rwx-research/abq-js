import { Socket } from 'net'
import { AbqConfiguration } from './configuration'

export async function connect(abqConfig: AbqConfiguration): Promise<Socket> {
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
      () => resolve(socket)
    )
  })
}
