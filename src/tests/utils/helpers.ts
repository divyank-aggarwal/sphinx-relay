import http = require('ava-http')
import { NodeConfig, RequestArgs, RequestBody } from '../types'
import { config } from '../config'

export const makeArgs = (
  node: NodeConfig,
  body: RequestBody = {}
): RequestArgs => {
  return {
    headers: { 'x-user-token': node.authToken },
    body,
  }
}

export const makeRelayRequest = async (
  method: string,
  path: string,
  node: NodeConfig,
  body?: RequestBody
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const reqFunc = http[method]
  const { response } = await reqFunc(
    node.external_ip + path,
    makeArgs(node, body)
  )
  return response
}

export function randomText() {
  const text = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
  return text
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export async function iterate(
  nodes: NodeConfig[],
  callback: (node1: NodeConfig, node2: NodeConfig) => Promise<void>
): Promise<void> {
  // dont iterate
  if (!config.iterate) {
    return callback(nodes[0], nodes[1])
  }
  // iterate through all node combinations
  const already: string[] = []
  await asyncForEach(nodes, async (n1: NodeConfig) => {
    await asyncForEach(nodes, async (n2: NodeConfig) => {
      if (n1.pubkey !== n2.pubkey) {
        const has = already.find((a) => {
          return a.includes(n1.pubkey) && a.includes(n2.pubkey)
        })
        if (!has) {
          already.push(`${n1.pubkey}-${n2.pubkey}`)
          await callback(n1, n2)
        }
      }
    })
  })
}