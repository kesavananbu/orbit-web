'use strict'

import React from 'react'
import { hot } from 'react-hot-loader'
import { Redirect } from 'react-router-dom'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import { CSSTransitionGroup } from 'react-transition-group'
import LoadAsync from '../components/Loadable'


import { version } from '../../package.json'

import Logger from '../utils/logger'
import {encrypt_message,decrypt_message,encrypt,decrypt,md5} from '../utils/crypto'
import RootStoreContext from '../context/RootStoreContext'

import '../styles/LoginView.scss'
import * as driver from 'bigchaindb-driver'


const BackgroundAnimation = LoadAsync({
  loader: () =>
    import(/* webpackChunkName: "BackgroundAnimation" */ '../components/BackgroundAnimation')
})
const LoginForm = LoadAsync({
  loader: () => import(/* webpackChunkName: "LoginForm" */ '../components/LoginForm')
})

const logger = new Logger()
var AccessGuest

class LoginView extends React.Component {
  
  static contextType = RootStoreContext
  static propTypes = {
    location: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  }
  
  constructor (props) {
    super(props)
    this.onConfigure = this.onConfigure.bind(this)
    this.onLogin = this.onLogin.bind(this)
    this.onCheck = this.onCheck.bind(this)
    this.focusUsernameInput = this.focusUsernameInput.bind(this)
    this.focusPasswordInput = this.focusPasswordInput.bind(this)
    this.onError = this.onError.bind(this) 
  }

  state = {
    error : false,
    errormsg : ''
  }

  errorhandle = (value,msg='') => this.setState({ error : value, errormsg : msg})

  onCheck(e, username, password, signup)
  {
    if(signup == true)
    {
    AccessGuest.get_userrecord(md5(username),true).then(
      (resolve) => this.onError(e,'User Already Exist'),
      (reject) => this.onLogin(e,username,password,true))
      
    }
    else
    {
    AccessGuest.get_userrecord(md5(username),true).then(
      (resolve) => (
        this.validateData(resolve,password) === 'Success' ?
          AccessGuest.get_userrecord(md5(`${username}[channels]`)).then(
            (resolve) => this.validateData(resolve,password).then(res => this.onLogin(e,username,password)),
            (reject) =>  this.onLogin(e,username,password))
            : this.onError(e,'Username or Password is incorrect')),
      (reject) => this.onError(e,'Username not found'))
    }
    
  }

  validateData(result,password)
  {
    try{
    const data = decrypt(result.Data,md5(password))
    const resultextract=JSON.parse(data)
    for (var key in resultextract)
    {
      if (resultextract.hasOwnProperty(key)) {
       const value = resultextract[key]
        localStorage.setItem(key,JSON.stringify(value))
      }
    }
    return "Success"
    }
    catch(err)
    {
      return "Failure"
    }
  }
      
  componentDidMount () {
    const { uiStore,networkStore } = this.context
    uiStore.setTitle('Login')
    uiStore.closeControlPanel()
    AccessGuest = networkStore
  }

  onLogin (e, username, password,update=false) {

    const { sessionStore } = this.context
    this.errorhandle(false)
    e.preventDefault()
    if(update)
      sessionStore.updae(true)
    if (username !== '' && password !== '') {
      password = md5(password)
      sessionStore.login({ username,password }).catch(e => {
        logger.error(e)
      })
    }
  }

  onError (e,msg)
  { 
    e.preventDefault()
    this.errorhandle(true,msg)
  }

  focusUsernameInput () {
    if (this.usernameInputRef) this.usernameInputRef.current.focus()
  }

  focusPasswordInput () {
    if (this.passwordInputRef) this.passwordInputRef.current.focus()
  }

  render () {
    const { sessionStore, uiStore } = this.context
    const { t, location } = this.props
    const { from } = location.state || { from: { pathname: '/' } }

    if (sessionStore.isAuthenticated) return <Redirect to={from} />

    return (
      <div className="LoginView">
        <CSSTransitionGroup
          className="header"
          transitionName="loginHeaderAnimation"
          transitionAppear={true}
          component="div"
          transitionAppearTimeout={5000}
          transitionEnterTimeout={5000}
          transitionLeaveTimeout={5000}
        >
          <h1 onClick={this.focusUsernameInput}>IPFS Orbit</h1>
        </CSSTransitionGroup>

        <LoginForm
          theme={{ ...uiStore.theme }}
          setUsernameInputRef={ref => (this.usernameInputRef = ref)}
          setPasswordInputRef={ref => (this.passwordInputRef = ref)}
          onCheck={this.onCheck}
          error = {this.state.error}
          errorhandle = {this.errorhandle}
          errormsg = {this.state.errormsg}          
        />
        <div className="Version">
          {t('version')}: {version}
        </div>
        <BackgroundAnimation
          size={480}
          theme={{ ...uiStore.theme }}
          onClick={this.focusUsernameInput}
        />
      </div>
    )
  }
}

export default hot(module)(withTranslation()(observer(LoginView)))
