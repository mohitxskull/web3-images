import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UploadValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    image: schema.file({
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg'],
    }),
  })

  public messages: CustomMessages = {
    'image.file.size': 'File size should be less than {{ options.size }}',
    'image.file.extname': 'File extension should be one of {{ options.extnames }}',
  }
}
