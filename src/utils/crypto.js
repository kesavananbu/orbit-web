import CryptoJs from 'crypto-js'
import defaults from '../config/default.json'

const data=JSON.parse(JSON.stringify(defaults))
const masterkey= data['globalkey']

export function md5(value)
{
  return CryptoJs.MD5(value).toString(CryptoJs.enc.Hex)
}

export function encrypt(value, key) {
  return CryptoJs.AES.encrypt(value, key).toString()
}

export function decrypt (value, key) {
  return CryptoJs.AES.decrypt(value, key).toString(CryptoJs.enc.Utf8)
}

export function encrypt_message(value) {
  return CryptoJs.AES.encrypt(value, masterkey).toString()
}

export function decrypt_message (value) {
  const d_value = CryptoJs.AES.decrypt(value, masterkey).toString(CryptoJs.enc.Utf8) 
  return d_value == "" ? value : d_value
} 

