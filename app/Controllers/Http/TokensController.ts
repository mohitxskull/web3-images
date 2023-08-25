import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import { MongoDBClient } from 'App/Client/mongodb'
import { TokenCreateQuerySchema } from 'App/Validators/zod'

export default class TokensController {
  private logger = Logger.child({
    controller: 'TokensController',
  })

  public async create({ request, response }: HttpContextContract) {
    const logger = this.logger.child({
      method: 'create',
    })

    try {
      const queryRaw = request.qs()

      const query = TokenCreateQuerySchema.safeParse(queryRaw)

      logger.info(
        {
          body: query,
        },
        'Get Token request params'
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

      const newToken = await MongoDBClient.getToken(query.data.use)

      return response.ok({
        status: 200,
        message: 'Token generated',
        data: {
          token: newToken,
        },
      })
    } catch (error) {
      logger.error(
        {
          err: error,
        },
        'Error while getting token'
      )

      return response.internalServerError({
        status: 500,
        message: 'Internal server error',
      })
    }
  }
}
