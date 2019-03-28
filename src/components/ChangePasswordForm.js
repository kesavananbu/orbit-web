'use strict'

import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'
import { useTranslation } from 'react-i18next'
import { Button } from 'semantic-ui-react'
import zxcvbn from 'zxcvbn';
import {md5} from '../utils/crypto'
import '../styles/SubmitButton.scss'
import '../styles/InputField.scss'


function ChangePasswordForm ({setPasswordInputRef,onSave, oldpassword }) {
  const [t] = useTranslation()
  const [passwordLength, setPasswordLength] = useState(0)
  const [active,setActive] = useState(false)
  const passwordInputRef = useRef()
  const [isValidPassword, setValidPassword] = useState(false)
  const [PasswordError, setPasswordError] = useState('')
  const [strength, setStrength] = useState(0)
  const minStrength = 2, thresholdLength = 7 


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
        else if (md5(password) == oldpassword)
        {
        setPasswordError('Password cannot be same as old')
        setValidPassword(false)
        }
        else {
        setPasswordError('')
        setValidPassword(true)
        }
      } 
          
    }
  const handleSubmit = ( e ) => 
  {
    if(passwordInputRef.current.value.trim()!=="")
    {
    setActive(!active)
    e.preventDefault()
    onSave(md5(passwordInputRef.current.value.trim()))
    }
  }

  return (
    <form onSubmit={e => handleSubmit(e) }>
        <div className="row" >
          <span className="key">{t('Change Password')}</span>
          <input  
            ref={passwordInputRef}          
            type="password"
            placeholder={t('Password')}
            required autoComplete={t("new-password")}
            maxLength="32"
            onChange={() => validatePassword()}
            disabled={active}
           />
          <Button toggle active={isValidPassword}  disabled={active || !isValidPassword}>{t('Save')}</Button>
        </div>
        {!isValidPassword ? <div className="row">
        <span className="key"/>
        <span className="error">{t(PasswordError)}</span>
        </div> : null  }
        {active ? <div className="row">
        <span className="key"/>
        <span className="hint">{t('Saved Successfully')}</span>
        </div> : null  }
    </form>
  )
}

ChangePasswordForm.propTypes = {
  setPasswordInputRef: PropTypes.func,
  onSave: PropTypes.func.isRequired,
  oldpassword : PropTypes.string.isRequired
}

export default ChangePasswordForm
