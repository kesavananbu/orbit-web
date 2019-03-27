import * as driver from 'bigchaindb-driver'
import defaults from '../config/default.json'
import Logger from '../utils/logger'
const logger = new Logger()

const data=JSON.parse(JSON.stringify(defaults))
const API_PATH = data.bigchaindb
// Send the transaction off to BigchainDB
const conn = new driver.Connection(API_PATH)

var user = new driver.Ed25519Keypair()

export function setkeys(keypair) {
    user =  keypair
}

export function getkeys() {
    return JSON.stringify(user)
}

export function setData(asset,metadata)
{
    const tx = driver.Transaction.makeCreateTransaction(
        // Define the asset to store
        asset,
        // Metadata contains information about the transaction itself
        metadata,
        // A transaction needs an output
        [ driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(user.publicKey))],
        // User Public Key
        user.publicKey
    )
    // Sign the transaction with private keys
    const txSigned = driver.Transaction.signTransaction(tx, user.privateKey)
    conn.postTransactionCommit(txSigned)
}

export function getData(data, value)
{   
    return new Promise(async (resolve, reject) => {
    const assets =await conn.searchAssets(data)
    if(assets.length==0) reject("Failure")
    else{
    const Userassets = assets.filter(asset => asset.data.datetime && (asset.data.IsUser==value) && (asset.data.User == data))
    const result = Userassets[Userassets.length-1]
    if(result) resolve(result)
    else reject("Failure")
    }
    })
}