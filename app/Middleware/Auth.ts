import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { MongoDBClient } from 'App/Client/mongodb'
import { UploadQuerySchema } from 'App/Validators/zod'

export default class Auth {
  public async handle(
    { request, response, logger }: HttpContextContract,
    next: () => Promise<void>
  ) {
    const queryRaw = request.qs()

    const query = UploadQuerySchema.safeParse(queryRaw)

    logger.info({ query }, 'url query')

    if (!query.success) {
      logger.error({ err: new Error('Invalid query params'), query }, 'query parsing error')

      return response.badRequest({
        status: 400,
        message: 'Invalid query params',
      })
    }

    const keyValid = await MongoDBClient.checkKey(query.data.key)

    logger.info({ keyValid }, 'keyValid result')

    if (!keyValid) {
      logger.error({ err: new Error('Invalid key'), key: query.data.key }, 'invalid key')

      return response.badRequest({
        status: 400,
        message: 'Invalid key',
      })
    }

    await next()
  }
}
