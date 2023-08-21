import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UploadValidator from 'App/Validators/UploadValidator'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
import { Web3StorageClient } from 'App/Client/web3storage'
import { File } from 'web3.storage'
import { GetQuerySchema, ImageMetaSchema, UploadQuerySchema } from 'App/Validators/zod'
import { MongoDBClient } from 'App/Client/mongodb'
import sharp from 'sharp'
import fetch from 'node-fetch'
import { ImageURL } from 'App/Helper/builder'

export default class ImagesController {
  public async upload({ request, response }: HttpContextContract) {
    const queryRaw = request.qs()

    const query = UploadQuerySchema.safeParse(queryRaw)

    console.info('ImagesController.upload -> query', query)

    if (!query.success) {
      console.error('ImagesController.upload -> query parsing error', query.error)

      return response.badRequest({
        status: 400,
        message: 'Invalid query params',
      })
    }

    const keyValid = await MongoDBClient.checkKey(query.data.key)

    console.info('ImagesController.upload -> keyValid', keyValid)

    if (!keyValid) {
      console.error('ImagesController.upload -> invalid key', query.data.key)

      return response.badRequest({
        status: 400,
        message: 'Invalid key',
      })
    }

    const payload = await request.validate(UploadValidator)

    try {
      const fileName = `${cuid()}.${payload.image.extname}`

      console.info('ImagesController.upload -> fileName', fileName)

      await payload.image.move(Application.tmpPath('uploads'), {
        name: fileName,
      })

      const imageFileRaw = await Drive.get(fileName)

      const imageFile = new File([imageFileRaw], 'image', {
        type: payload.image.type,
      })

      const cid = await Web3StorageClient.put([imageFile])

      console.info('ImagesController.upload -> cid', cid)

      Drive.delete(fileName)

      const metaRaw = await sharp(imageFileRaw).metadata()

      const meta = ImageMetaSchema.safeParse(metaRaw)

      if (!meta.success) {
        console.error(
          'ImagesController.upload -> meta parsing error',
          meta.error,
          'metadata',
          metaRaw
        )

        Web3StorageClient.delete(cid)

        Drive.delete(fileName)

        return response.badRequest({
          status: 400,
          message: 'Invalid image',
        })
      }

      const imgCuid = cuid()

      console.info('ImagesController.upload -> imgCuid', imgCuid)

      await MongoDBClient.addImg({
        cuid: imgCuid,
        cid: cid,
        height: meta.data.height,
        width: meta.data.width,
        format: meta.data.format,
        quality: 100,
        lastUsed: new Date(),
      })

      console.info('ImagesController.upload -> image added to db')

      return response.ok({
        status: 200,
        message: 'Image uploaded successfully',
        data: {
          cuid: imgCuid,
        },
      })
    } catch (error) {
      console.error('ImagesController.upload -> error')
      console.error(error)

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }

  public async get({ request, response }: HttpContextContract) {
    try {
      const queryRaw = request.qs()

      const query = GetQuerySchema.safeParse(queryRaw)

      console.info('ImagesController.get -> query', query)

      if (!query.success) {
        console.error('ImagesController.get -> query parsing error', query.error)

        return response.badRequest({
          status: 400,
          message: 'Invalid query params',
        })
      }

      const image = await MongoDBClient.getImg(query.data)

      console.info('ImagesController.get -> image', image)

      if (image) {
        response.header('Cache-Control', 'public, max-age=3600')

        return response.ok({
          status: 200,
          message: 'Image found',
          data: {
            url: ImageURL(image.cid),
          },
        })
      }

      const originalImage = await MongoDBClient.getOrgImg(query.data.cuid)

      console.info('ImagesController.get -> originalImage', originalImage)

      if (!originalImage) {
        return response.notFound({
          status: 404,
          message: 'Image not found',
        })
      }

      const oldImageRes = await fetch(ImageURL(originalImage.cid))

      console.info('ImagesController.get -> oldImageRes', oldImageRes)

      const oldImageBuffer = await oldImageRes.buffer()

      const newImageBuffer = await sharp(oldImageBuffer)
        .resize({
          width: query.data.width,
          height: query.data.height,
        })
        .toFormat(query.data.format, {
          quality: query.data.quality,
        })
        .toBuffer()

      const newImageFile = new File([newImageBuffer], 'image', {
        type: query.data.format,
      })

      const newImageCid = await Web3StorageClient.put([newImageFile])

      console.info('ImagesController.get -> newImageCid', newImageCid)

      MongoDBClient.addImg({
        cuid: query.data.cuid,
        cid: newImageCid,
        height: query.data.height,
        width: query.data.width,
        format: query.data.format,
        quality: query.data.quality,
        lastUsed: new Date(),
      })

      response.header('Cache-Control', 'public, max-age=3600')

      return response.ok({
        status: 200,
        message: 'Image found',
        data: {
          url: ImageURL(newImageCid),
        },
      })
    } catch (error) {
      console.error('ImagesController.get -> error')
      console.error(error)

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }
}
