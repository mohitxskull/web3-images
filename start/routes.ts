import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async ({ response }) =>
  response.ok({
    status: 200,
    message: 'WEB3 IMAGE API',
    creator: 'SKULL',
  })
)

Route.group(() => {
  Route.post('/upload', 'ImagesController.upload').middleware('auth')

  Route.post('/upload/token', 'ImagesController.tokenUpload')

  Route.get('/token', 'TokensController.create').middleware('auth')

  Route.get('/get', 'ImagesController.get')
}).prefix('/api')

Route.any('*', ({ response, logger, request }) => {
  logger.warn(`Route not found: ${request.url()}`)

  return response.notFound({
    status: 404,
    message: 'Route not found',
  })
})
