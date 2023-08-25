import { MongoClient } from 'mongodb'
import Env from '@ioc:Adonis/Core/Env'
import {
  CacheKeyGenFunType,
  ImageAddFunType,
  ImageColType,
  ImageGetFunType,
  KeyColType,
  TokenColType,
} from 'App/Validators/zod'
import NodeCache from 'node-cache'
import Logger from '@ioc:Adonis/Core/Logger'
import { cuid } from '@ioc:Adonis/Core/Helpers'

class MongoClass {
  private client = new MongoClient(Env.get('MONGODB'))

  private cache = new NodeCache()

  private logger = Logger.child({
    client: 'MongoDB',
  })

  public async connect() {
    await this.client.connect()
  }

  private get ImgCol() {
    return this.client.db('web').collection<ImageColType>('image')
  }

  private get KeyCol() {
    return this.client.db('web').collection<KeyColType>('key')
  }

  private get TokenCol() {
    return this.client.db('web').collection<TokenColType>('token')
  }

  private CacheKey(imageObj: CacheKeyGenFunType) {
    return [imageObj.cuid, imageObj.width, imageObj.height, imageObj.quality, imageObj.format].join(
      '-'
    )
  }

  public async getToken(use: number) {
    const newToken = cuid()

    await this.TokenCol.insertOne({
      token: newToken,
      useLeft: use,
      expAt: new Date(Date.now() + use * 50 * 1000),
    })

    return newToken
  }

  public async canUseToken(token: string) {
    const logger = this.logger.child({
      method: 'canUseToken',
    })

    const cacheKey = `token-${token}`

    let tokenObj: TokenColType | null = this.cache.get(cacheKey) ?? null

    if (!tokenObj) {
      tokenObj = await this.TokenCol.findOne({
        token,
      })

      if (tokenObj) {
        this.cache.set(cacheKey, tokenObj, 60)
      }
    }

    logger.info(
      {
        tokenObj,
      },
      'Token Object'
    )

    if (!tokenObj) {
      logger.warn('Token not found')

      return null
    }

    if (tokenObj.expAt < new Date() || tokenObj.useLeft === 0) {
      logger.warn('Token expired or use left is 0')

      await this.TokenCol.deleteOne({
        token,
      })

      return null
    }

    return tokenObj
  }

  public async useToken(token: string) {
    const canUse = await this.canUseToken(token)

    if (!canUse) {
      return false
    }

    if (canUse.useLeft === 1) {
      await this.TokenCol.deleteOne({
        token,
      })

      return true
    }

    await this.TokenCol.updateOne(
      {
        token,
      },
      {
        $inc: {
          useLeft: -1,
        },
      }
    )

    return true
  }

  public async checkKey(key: string) {
    const result = await this.KeyCol.findOne({ key })

    if (result) {
      return true
    } else {
      return false
    }
  }

  public async addImg(imageObj: ImageAddFunType) {
    const result = await this.ImgCol.insertOne(imageObj)

    const cacheKey = this.CacheKey(imageObj)

    this.cache.set(cacheKey, imageObj, 60 * 60 * 24)

    return result.insertedId
  }

  public async deleteImg(cuid: string) {
    try {
      await this.ImgCol.deleteOne({ cuid })

      return true
    } catch (error) {
      console.error('MongoDBClient.deleteImg -> error', error)

      return false
    }
  }

  public async getOrgImg(cuid: string) {
    const allImgByCuid = await this.ImgCol.find({ cuid }).toArray()

    if (allImgByCuid.length === 0) {
      return null
    }

    const sortedByHeight = allImgByCuid.sort((a, b) => b.height - a.height)

    const sortedByWidth = sortedByHeight.sort((a, b) => b.width - a.width)

    const sortedByQuality = sortedByWidth.sort((a, b) => b.quality - a.quality)

    return sortedByQuality[0]
  }

  public async updateLastUsed(cid: string) {
    const result = await this.ImgCol.updateOne({ cid }, { $set: { lastUsed: new Date() } })

    return result.modifiedCount
  }

  public async getImg(imageParams: ImageGetFunType) {
    const cacheKey = this.CacheKey(imageParams)

    let result: ImageColType | null = this.cache.get(cacheKey) ?? null

    if (!result) {
      result = await this.ImgCol.findOne(imageParams)

      if (result) {
        this.cache.set(cacheKey, result, 60 * 60 * 24)
      }
    }

    if (result) {
      this.updateLastUsed(result.cid)
    }

    return result
  }
}

export const MongoDBClient = new MongoClass()
