'use strict'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'
import { useTranslation } from 'react-i18next'
import { Button } from 'semantic-ui-react'
import zxcvbn from 'zxcvbn';
import { validate } from 'isemail';
import '../styles/SubmitButton.scss'
import '../styles/InputField.scss'


function LoginForm ({ theme, setUsernameInputRef, setPasswordInputRef , onCheck, error, errorhandle, errormsg }) {
  const [t] = useTranslation()
  const [usernameLength, setUsernameLength] = useState(0)
  const [passwordLength, setPasswordLength] = useState(0)
  const [active,setActive] = useState(false)
  const [isValidUsername, setValidUsername] = useState(true)
  const [isValidPassword, setValidPassword] = useState(true)
  const [isValidLogin, setValidLogin] = useState(true)
  const [UsernameError, setUsernameError] = useState('')
  const [PasswordError, setPasswordError] = useState('')
  const [strength, setStrength] = useState(0)
  const usernameInputRef = useRef()
  const passwordInputRef = useRef()
  const minStrength = 2, thresholdLength = 7 

  useEffect(() => {
    if (typeof setUsernameInputRef === 'function') setUsernameInputRef(usernameInputRef)
    if (typeof setPasswordInputRef === 'function') setPasswordInputRef(passwordInputRef)
    return () => {
      if (typeof setUsernameInputRef === 'function') setUsernameInputRef(null)
      if (typeof setPasswordInputRef === 'function') setPasswordInputRef(null)
    }
  })


  const signuphandle= () => {
    

  }
    const validateUsername = () => {
      const email = usernameInputRef.current.value
      setUsernameLength(usernameInputRef.current.value.length)
      if(!email){
        setUsernameError('Email cannot be empty')
        setValidUsername(false)
        }
      else if(typeof email !== "undefined"){
           if(validate(email))
           { 
            setUsernameError('')
            setValidUsername(true)
           }
          else {
            setUsernameError('Email is not valid')
            setValidUsername(false)
          }
       }
    }

    const validatePassword = () => {
      const password = passwordInputRef.current.value
      setPasswordLength(passwordInputRef.current.value.length)
      setStrength(zxcvbn(password).score)
      if(!password) 
      {
        setPasswordError('Password cannot be empty')
        setValidPassword(false)
      }
      else if (typeof password !== "undefined")
      {
        if (passwordLength < thresholdLength){
        setPasswordError('Password is short (min 8 characters)')
        setValidPassword(false)
        } 
		    else if (strength < minStrength){
        setPasswordError('Password is weak')
        setValidPassword(false)
        } 
        else {
        setPasswordError('')
        setValidPassword(true)
        }
      } 
          
    }

    const handleKeyPress = (event) => {
    if(event.key == 'Enter'){
      if (!isValidUsername || !isValidPassword)
      {
          event.preventDefault()
          setValidLogin(false)
      }
    }
    else {
      setValidLogin(true)
      errorhandle(false)
    }
  }

  return (
    <form onSubmit={e => onCheck(e, usernameInputRef.current.value.trim(),passwordInputRef.current.value.trim(), active ) }>
      <CSSTransitionGroup 
        transitionName="loginScreenAnimation"
        transitionAppear={true}
        component="div"
        className="inputs"
        transitionAppearTimeout={5000}
        transitionEnterTimeout={5000}
        transitionLeaveTimeout={5000}>
        <div className="usernameRow" onClick={() => usernameInputRef.current.focus()}>
          <input
            ref={usernameInputRef}
            type="text"
            placeholder={t('Email')}
            required autoComplete="email"
            maxLength="32"
            autoFocus
            style={theme}
            onKeyPress={handleKeyPress}
            onChange={() => validateUsername()}
          />
        </div>
        {!isValidUsername  && active ? <div className="connectButtonRow">
        <span className="error">{t(UsernameError)}</span>
        </div> : null}
        <div className="usernameRow" >
          <input  
            ref={passwordInputRef}          
            type="password"
            placeholder={t('Password')}
            required autoComplete={active ? t("new-password") : t("current-password")}
            maxLength="32"
            style={theme}
            onKeyPress={handleKeyPress}
            onChange={() => validatePassword()}
           />
        </div>
        {!isValidPassword && active ? <div className="connectButtonRow">
        <span className="error">{t(PasswordError)}</span>
        </div> : null  }
        <div className="connectButtonRow">
          <span className={error ? t('error') : t('hint')}>{ error ? t(errormsg) : (usernameLength >0  && passwordLength > 0) ? isValidLogin ? t('Press ENTER to proceed') : t('Username and Password requirements is not satisfied') : t('Please provide the username and password') }</span>
          <input type="submit" value="Connect" style={{ display: 'none' }} />
        </div>
        <div className="connectButtonRow">
          <Button toggle active={active} onClick={function(e) { setActive(!active); e.preventDefault(); }}>Sign Up</Button>
        </div>
      </CSSTransitionGroup>
    </form>
  )
}

LoginForm.propTypes = {
  theme: PropTypes.object.isRequired,
  setUsernameInputRef: PropTypes.func,
  setPasswordInputRef: PropTypes.func,
  onCheck: PropTypes.func.isRequired,
  error : PropTypes.bool.isRequired,
  errorhandle : PropTypes.func.isRequired,
  errormsg : PropTypes.string.isRequired
}

export default LoginForm
