'use strict'

import { action, computed, configure, keys, observable, reaction, values, autorun } from 'mobx'

import ChannelStore from './ChannelStore'
import IpfsStore from './IpfsStore'
import OrbitStore from './OrbitStore'
import OrbitDB from 'orbit-db'
import Logger from '../utils/logger'
import {encrypt_message,decrypt_message,encrypt,decrypt,md5} from '../utils/crypto'
import * as bigchain from '../utils/bigchain'

configure({ enforceActions: 'observed' })

const logger = new Logger()

const peerUpdateInterval = 1000 // ms
const processSendQueueInterval = 100 // ms

export default class NetworkStore {
  constructor (rootStore) {
    this.sessionStore = rootStore.sessionStore
    this.settingsStore = rootStore.settingsStore
    this.ipfsStore = new IpfsStore(this)
    this.orbitStore = new OrbitStore(this)
    this.joinChannel = this.joinChannel.bind(this)
    this.channelPeerInterval = setInterval(() => {
      this.channelsAsArray.forEach(c => c.updatePeers())
    }, peerUpdateInterval)

    this.channelProcessInterval = setInterval(() => {
      this.channelsAsArray.forEach(c => c.processSendQueue())
    }, processSendQueueInterval)

    // Stop if user logs out, start if not already online or not starting
    reaction(
      () => this.sessionStore.user,
      user => {
        if (!user) this.stop()
        else if (!(this.isOnline || this.starting)) this.start().then(res => this.update_credentials())
      }
    )

    // autorun( reaction => {
    //   if(!(this.isOnline || this.starting)) this.load()
    //   reaction.dispose();
    //   },{delay:100});
    
    
  }

  // Public instance variables

  networkName = 'Orbit DEV Network'

  @observable
  channels = {}

  @observable
  swarmPeers = []

  // Public instance getters

  @computed
  get ipfs () {
    return this.ipfsStore.node
  }

  @computed
  get orbit () {
    return this.orbitStore.node
  }

  @computed
  get isOnline () {
    return this.ipfs && this.orbit
  }

  @computed
  get starting () {
    return this.ipfsStore.starting || this.orbitStore.starting
  }

  @computed
  get hasUnreadMessages () {
    return this.channelsAsArray.some(c => c.hasUnreadMessages)
  }

  @computed
  get channelNames () {
    return keys(this.channels)
  }

  @computed
  get channelsAsArray () {
    return values(this.channels)
  }

  // Private instance actions

  @action.bound
  _onJoinedChannel (channelName) {
    if (this.channelNames.indexOf(channelName) !== -1) return

    const orbitChannel = this.orbit.channels[channelName]
    this.channels[channelName] = new ChannelStore({
      network: this,
      orbitChannel
    })

    // Save the channel to localstorage
    // so user will connect to it automatically next time
    const networkSettings = this.settingsStore.networkSettings
    networkSettings.channels = [
      ...networkSettings.channels.filter(c => c !== channelName),
      channelName
    ]
  }

  @action.bound
  _onLeftChannel (channelName) {
    this._removeChannel(channelName)

    // Remove the channel from localstorage
    const networkSettings = this.settingsStore.networkSettings
    networkSettings.channels = networkSettings.channels.filter(c => c !== channelName)
  }

  @action.bound
  _onSwarmPeerUpdate (peers) {
    this.swarmPeers = peers
  }

  @action.bound
  _removeChannel (channelName) {
    delete this.channels[channelName]
  }

  @action.bound
  _resetSwarmPeers () {
    this.swarmPeers = []
  }

  // Public instance methods

  async joinChannel (channelName,value=false) {
    if (!this.isOnline) throw new Error('Network is not online')
    if (this.channelNames.indexOf(channelName) === -1) {
      await this.orbit.join(channelName)
      if(value == true) this.update_channels()
    }
    return this.channels[channelName]
  }

  async leaveChannel (channelName,value=false) {
    if (!this.isOnline) throw new Error('Network is not online')
    if (this.channelNames.indexOf(channelName) !== -1) {
      await this.orbit.leave(channelName)
      if(value == true) this.update_channels()
    }
  }
    
  async update_channels()
  {
    logger.warn("Updating Channels")
    var channel_settings = {}
    channel_settings[`orbit-chat.${this.sessionStore.username}.network-settings`] = JSON.parse(localStorage.getItem(`orbit-chat.${this.sessionStore.username}.network-settings`))
    channel_settings[`orbit-chat.${this.sessionStore.username}.network-settings`].channels= this.channelNames
    const user_channel= encrypt(JSON.stringify(channel_settings),this.sessionStore.password)
    const user_channelkey = md5(`${this.sessionStore.username}[channels]`)
    this.set_userrecord(user_channelkey,user_channel,false).then(res => logger.info('Updated Channels'))

  }

  async update_credentials()
  {
    if(this.sessionStore.IsNeedUpdate)
    {
      var user_private_store = {}
      logger.warn(this.sessionStore.username,this.sessionStore.password)
      user_private_store[this.sessionStore.username]=JSON.parse(localStorage.getItem(this.sessionStore.username))
      user_private_store[user_private_store[this.sessionStore.username]['publicKey']]=JSON.parse(localStorage.getItem(user_private_store[this.sessionStore.username]['publicKey']))
      const user_store= encrypt(JSON.stringify(user_private_store),this.sessionStore.password)
      const user_key = md5(this.sessionStore.username)
      this.set_userrecord(user_key,user_store,true)
      this.sessionStore.update(false)
    }
  }

  async get_userrecord(key, value=false){
    return new Promise(function(resolve,reject)
    {
        bigchain.getData(key,value).then(res => resolve({"Message":"Success","Data":res.data.Message}), rej => reject({"Message":"Failure"}))
    })
  }

  async set_userrecord(key,value,user)
  {
    const asset = { "Message" : value,"User" : key, "IsUser" : user, datetime : new Date().toString() }
    const metadata = { "Orgin" : "Orbit-IPFS" }
    bigchain.setData(asset,metadata)
  }

  // async load(){
  //   if (this.ipfs) return
  //   logger.info('Starting network')
  //   if(!this.ipfsStore.starting)
  //   await this.ipfsStore.useEmbeddedIPFS()
  //   const orbitNode = await this.guestStore.init(this.ipfs)
  //   this.orbitdb = await orbitNode._orbitdb.open('/orbitdb/zdpuB1S886QjTfFAbTwZMXe9eeMf5suH9rC4M3GkYtQZ1qQPh/UsersCredentials')
  //   await this.orbitdb.load()
  //   this.orbitdb.events.on("replicated", () => {
  //   logger.info("Replicated")
  //   })
  // }
  async start () {
    if (this.isOnline) return
    logger.info('Starting network')
    await this.ipfsStore.useEmbeddedIPFS()
    const orbitNode = await this.orbitStore.init(this.ipfs)  
    orbitNode.events.on('joined', this._onJoinedChannel)
    orbitNode.events.on('left', this._onLeftChannel)
    orbitNode.events.on('peers', this._onSwarmPeerUpdate)
    // Join all channnels that are saved in localstorage for current user
    this.settingsStore.networkSettings.channels.forEach(this.joinChannel)
  }

  async stop () {
    if (!this.isOnline) return
    logger.info('Stopping network')

    clearInterval(this.channelPeerInterval)
    clearInterval(this.channelProcessInterval)

    this.channelNames.forEach(this._removeChannel)
    this._resetSwarmPeers()

    await this.orbitStore.stop()
    await this.ipfsStore.stop()
  }
}
