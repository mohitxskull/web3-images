import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UploadValidator from 'App/Validators/UploadValidator'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
import { Web3StorageClient } from 'App/Client/web3storage'
import { File } from 'web3.storage'
import { GetQuerySchema, ImageMetaSchema } from 'App/Validators/zod'
import { MongoDBClient } from 'App/Client/mongodb'
import sharp from 'sharp'
import fetch from 'node-fetch'
import { ImageURL } from 'App/Helper/builder'
import Logger from '@ioc:Adonis/Core/Logger'
import TokenValidator from 'App/Validators/TokenValidator'

export default class ImagesController {
  private logger = Logger.child({
    controller: 'ImagesController',
  })

  private async fileUpload(fileName: string, imageType?: string) {
    const logger = this.logger.child({
      method: 'fileUpload',
    })

    const imageFileRaw = await Drive.get(fileName)

    const imageFile = new File([imageFileRaw], 'image', {
      type: imageType,
    })

    const cid = await Web3StorageClient.put([imageFile])

    logger.info({ cid }, 'cid of image')

    Drive.delete(fileName)

    const metaRaw = await sharp(imageFileRaw).metadata()

    const meta = ImageMetaSchema.safeParse(metaRaw)

    if (!meta.success) {
      logger.error(
        {
          metaErr: meta.error,
          metaRaw,
        },
        'Error while getting image metadata'
      )

      Web3StorageClient.delete(cid)

      Drive.delete(fileName)

      return null
    }

    const imgCuid = cuid()

    logger.info(
      {
        imageCuid: imgCuid,
      },
      'Image CUID'
    )

    MongoDBClient.addImg({
      cuid: imgCuid,
      cid: cid,
      height: meta.data.height,
      width: meta.data.width,
      format: meta.data.format,
      quality: 100,
      lastUsed: new Date(),
    })

    return imgCuid
  }

  public async upload({ request, response }: HttpContextContract) {
    const logger = this.logger.child({
      method: 'upload',
    })

    const payload = await request.validate(UploadValidator)

    try {
      const fileName = `${cuid()}.${payload.image.extname}`

      logger.info(
        {
          fileName,
        },
        'Image File name'
      )

      await payload.image.move(Application.tmpPath('uploads'), {
        name: fileName,
      })

      const imgCuid = await this.fileUpload(fileName, payload.image.type)

      if (!imgCuid) {
        return response.badRequest({
          staus: 400,
          message: 'Invalid Image',
        })
      }

      return response.ok({
        status: 200,
        message: 'Image uploaded successfully',
        data: {
          cuid: imgCuid,
        },
      })
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        'Error while uploading image'
      )

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }

  public async tokenUpload({ request, response }: HttpContextContract) {
    const logger = this.logger.child({
      method: 'tokenUpload',
    })

    const payload = await request.validate(TokenValidator)

    try {
      const canUseToken = await MongoDBClient.canUseToken(payload.token)

      logger.info(
        {
          canUseToken,
          token: payload.token,
        },
        'Token Validation'
      )

      if (!canUseToken) {
        return response.badRequest({
          status: 400,
          message: 'Invalid token',
        })
      }

      const fileName = `${cuid()}.${payload.image.extname}`

      logger.info(
        {
          fileName,
        },
        'Image File name'
      )

      await payload.image.move(Application.tmpPath('uploads'), {
        name: fileName,
      })

      const imgCuid = await this.fileUpload(fileName, payload.image.type)

      if (!imgCuid) {
        return response.badRequest({
          staus: 400,
          message: 'Invalid Image',
        })
      }

      MongoDBClient.useToken(payload.token)

      return response.ok({
        status: 200,
        message: 'Image uploaded successfully',
        data: {
          cuid: imgCuid,
        },
      })
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        'Error while uploading image (token)'
      )

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }

  public async get({ request, response }: HttpContextContract) {
    const logger = this.logger.child({
      method: 'get',
    })

    try {
      const queryRaw = request.qs()

      const query = GetQuerySchema.safeParse(queryRaw)

      logger.info(
        {
          body: query,
        },
        'Get image request params'
      )

      if (!query.success) {
        logger.error(
          {
            zodErr: query.error,
          },
          'Query Parsing Error'
        )

        return response.badRequest({
          status: 400,
          message: 'Invalid query params',
        })
      }

      const image = await MongoDBClient.getImg(query.data)

      logger.info(
        {
          image,
        },
        'Image Object'
      )

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

      logger.info(
        {
          image: originalImage,
        },
        'Original Image Object'
      )

      if (!originalImage) {
        return response.notFound({
          status: 404,
          message: 'Image not found',
        })
      }

      const oldImageRes = await fetch(ImageURL(originalImage.cid))

      logger.info(
        {
          fetchRes: oldImageRes,
        },
        'Old Image Download Response'
      )

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

      logger.info(
        {
          cid: newImageCid,
        },
        'New Generated Image CID'
      )

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
      logger.error(
        {
          err: error,
        },
        'Error while getting image'
      )

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }
}
