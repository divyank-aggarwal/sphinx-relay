import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/actions'
import fetch from 'node-fetch'
var validate = require('bitcoin-address-validation');
const msg_types = Sphinx.MSG_TYPE

let initted = false

const baseurl = 'https://localhost:8080'

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    const arr = message.content.split(' ')
    if (arr.length < 2) return
    if (arr[0] !== '/loopout') return

    if (arr.length === 3) { // loop
      const addy = arr[1]
      if (!validate(addy)) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('LoopBot')
          .setDescription('Invalid BTC address')
        message.channel.send({ embed })
        return
      }
      const amt = arr[2]
      if (!validateAmount(amt)) {
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('LoopBot')
          .setDescription('Invalid amount')
        message.channel.send({ embed })
        return
      }
      try {
        const j = await doRequest(baseurl + '/v1/loop/out/quote/'+amt)
        console.log("=> LOOP QUOTE RES", j)
        if(!(j&&(j.swap_fee||j.swap_fee_sat))){
          return
        }
        const j2 = await doRequest(baseurl + '/v1/loop/out', {
          method:'POST',
          body: JSON.stringify({
            amt: amt,
            dest: addy,
            outgoing_chan_set:[
              '704899103684034561'
            ]
          }),
        })
        console.log("=> LOOP RESPONSE", j2)
        if(!(j2&&j2.server_message)) {
          return
        }
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('LoopBot')
          .setTitle('Loop Initialized!')
          .setDescription(j2.server_message)
        message.channel.send({ embed })
      } catch (e) {
        console.log('LoopBot error', e)
      }
    }

    const cmd = arr[1]
    switch (cmd) {
      case 'help':
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('LoopBot')
          .setTitle('LoopBot Commands:')
          .addFields([
            { name: 'Send to your on-chain address', value: '/loopout {ADDRESS} {AMOUNT}' },
            { name: 'Help', value: '/loopout help' }
          ])
          .setThumbnail(botSVG)
        message.channel.send({ embed })
        return
      default:
        const embed2 = new Sphinx.MessageEmbed()
          .setAuthor('LoopBot')
          .setDescription('Command not recognized')
        message.channel.send({ embed: embed2 })
        return
    }
  })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`

function validateAmount(amtString: string) {
  const amt = parseInt(amtString)
  const ok = amt > 0
  return ok
}

const fs = require('fs')
const https = require("https");
const homedir = require('os').homedir();
const agent = new https.Agent({
  rejectUnauthorized: false
})

var filepath = homedir + '/.lnd/data/chain/bitcoin/mainnet/admin.macaroon'

async function doRequest(theurl:string, params?:Object) {
  const ps = params || {}
  try {
    var macaroonString = fs.readFileSync(filepath);
    var mac = Buffer.from(macaroonString, 'utf8').toString('hex');
    const theParams = {
      agent,
      headers: {
        'Grpc-Metadata-macaroon': mac
      },
      ...ps
    }
    const r = await fetch(theurl, theParams)
    const j = await r.json()
    return j
  } catch (e) {
    throw e
  }
}