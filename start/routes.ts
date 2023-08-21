import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async ({ response }) =>
  response.ok({
    status: 200,
    message: 'WEB3 IMAGE API',
  })
)

Route.group(() => {
  Route.post('/upload', 'ImagesController.upload')
  Route.get('/get', 'ImagesController.get')
}).prefix('/api')

Route.any('*', ({ response, logger, request }) => {
  logger.warn(`Route not found: ${request.url()}`)

  return response.notFound({
    status: 404,
    message: 'Route not found',
  })
})
