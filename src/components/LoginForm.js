'use strict'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'
import { useTranslation } from 'react-i18next'
import { Button } from 'semantic-ui-react'

import '../styles/SubmitButton.scss'
import '../styles/InputField.scss'


function LoginForm ({ theme, setUsernameInputRef, setPasswordInputRef , onCheck, error }) {
  const [t] = useTranslation()
  const [usernameLength, setUsernameLength] = useState(0)
  const [passwordLength, setPasswordLength] = useState(0)
  const [active,setActive] = useState(false)

  const usernameInputRef = useRef()
  const passwordInputRef = useRef()

  useEffect(() => {
    if (typeof setUsernameInputRef === 'function') setUsernameInputRef(usernameInputRef)
    if (typeof setPasswordInputRef === 'function') setPasswordInputRef(passwordInputRef)
    return () => {
      if (typeof setUsernameInputRef === 'function') setUsernameInputRef(null)
      if (typeof setPasswordInputRef === 'function') setPasswordInputRef(null)
    }
  })

    const handleKeyPress = (event) => {
    if(event.key == 'Enter'){
      (passwordLength <=0 || usernameLength <=0) ? event.preventDefault() : null
    }
  }

  return (
    <form onSubmit={e => passwordLength > 0 ? onCheck(e, usernameInputRef.current.value.trim(),passwordInputRef.current.value.trim(), active ) : null }>
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
            maxLength="32"
            autoFocus
            style={theme}
            onKeyPress={handleKeyPress}
            onChange={() => setUsernameLength(usernameInputRef.current.value.length)}
          />
        </div>
        <div className="usernameRow" >
          <input  
            ref={passwordInputRef}          
            type="password"
            placeholder={t('Password')}
            suggested = {active ? t("new-password") : t("current-password") }
            maxLength="32"
            style={theme}
            onKeyPress={handleKeyPress}
            onChange={() => setPasswordLength(passwordInputRef.current.value.length)}
           />
        </div>
        <div className="connectButtonRow">
          <span className={error ? t('error') : t('hint')}>{ error ? t('Username or Password is incorrect') : (usernameLength >0  && passwordLength > 0) ? t('Press ENTER to proceed') : t('Please provide the username and password') }</span>
          <input type="submit" value="Connect" style={{ display: 'none' }} />
        </div>
        <div className="connectButtonRow">
          <Button toggle active={active} onClick={() => setActive(!active)}>Sign Up</Button>
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
  error : PropTypes.bool.isRequired
}

export default LoginForm
