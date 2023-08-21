import { Web3Storage } from 'web3.storage'
import Env from '@ioc:Adonis/Core/Env'

export const Web3StorageClient = new Web3Storage({ token: Env.get('WEB3STORAGEAPITOKEN') })
