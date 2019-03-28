'use strict'

import { action, configure, observable, computed, runInAction } from 'mobx'

import Logger from '../utils/logger'
import * as cookies from '../utils/cookies'

configure({ enforceActions: 'observed' })

const logger = new Logger()

const cookieUsernameKey = 'orbit-chat-username'
const cookiePasswordKey = 'orbit-chat-password'
const cookieUpdateKey =  'orbit-chat-update'

export default class SessionStore {
  constructor (rootStore) {
    this.rootStore = rootStore
    this.update = this.update.bind(this)
    this.changePassword = this.changePassword.bind(this)
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
  }

  // Private instance variables

  @observable
  _user = null

  @observable
  _update = null

  // Public instance variable getters
  @computed
  get user ()
  {
    if(!this._user || !this._user.username || !this._user.password) return null
    return this._user
  }

  @computed
  get username () {
    if (!this._user || !this._user.username) return null
    return this._user.username
  }

  @computed
  get password () {
    if (!this._user || !this._user.password) return null
    return this._user.password
  }

  @computed
  get IsNeedUpdate() {
    if (!this._update) return null
    return this._update
  }

  @computed
  get isAuthenticated () {
    return !!(this._user && this._user.username && this._user.password)
  }

  // Private instance actions

  // Async so the API is consistend if async is needed in the future
  @action.bound
  async _setUser (user) {
    if (user && !user.username) throw new Error('"user.username" is not defined')
    if (user && !user.password) throw new Error('"user.password" is not defined')
    runInAction(() => {
      this._user = user
    })
    this._cacheUser(user)
  }

  @action.bound
  async _setUpdate (value){
    runInAction(() => {
      this._update = value
    })
    this._cacheUpdate(value)
  }
  // Private instance methods

  _readUserFromCache () {
    const username = cookies.getCookie(cookieUsernameKey)
    const password = cookies.getCookie(cookiePasswordKey)
    return username ? { username, password } : null
  }

  _readUpdateFromCache () {
    const value = cookies.getCookie(cookieUpdateKey)
    return value ? value : null
  }

  _cacheUser (user) {
    if (user) {
      cookies.setCookie(cookieUsernameKey, user.username, 1)
      cookies.setCookie(cookiePasswordKey, user.password, 1)
    } else {
      cookies.expireCookie(cookieUsernameKey)
      cookies.expireCookie(cookiePasswordKey)
    }
  }

  _cacheUpdate(value)
  {
    if(value)
      cookies.setCookie(cookieUpdateKey,value,1)
    else
      cookies.expireCookie(cookieUpdateKey)   
  }
  // Public instance methods

  loadFromCache () {
    const cached = this._readUserFromCache()
    const cachedupdate=this._readUpdateFromCache()
    if(cachedupdate) this._setUpdate(cachedupdate)
    if (cached) this.login(cached)
  }

  update (value) {
    this._setUpdate(value)
  }

  changePassword(password) {
    this.update(true)
    const username= this.username
    this._setUser({username,password})
  }

  login (user) {
    logger.info('User login')
    return this._setUser(user)
  }

  logout () {
    logger.info('User logout')
    return this._setUser(null)
  }
}
