import { z } from 'zod'

const ValidFormatSchema = z.enum(['jpg', 'png', 'jpeg', 'webp', 'avif'])

const TokenUseSchema = z.number().min(1).max(50)

// ==================================================================

export const KeyColSchema = z.object({
  key: z.string(),
})

export type KeyColType = z.infer<typeof KeyColSchema>

export const ImageColSchema = z.object({
  cuid: z.string(),
  cid: z.string(),
  height: z.number(),
  width: z.number(),
  quality: z.number().min(1).max(100),
  format: ValidFormatSchema,
  lastUsed: z.date(),
})

export type ImageColType = z.infer<typeof ImageColSchema>

export const TokenColSchema = z.object({
  token: z.string(),
  useLeft: TokenUseSchema,
  expAt: z.date(),
})

export type TokenColType = z.infer<typeof TokenColSchema>

// ==================================================================

export const UploadQuerySchema = KeyColSchema

export const GetQuerySchema = z.object({
  cuid: z.string(),

  width: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Must be a number')
    .transform((val) => Number(val)),

  height: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Must be a number')
    .transform((val) => Number(val)),

  quality: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Must be a number')
    .transform((val) => Number(val)),

  format: ValidFormatSchema,
})

export const TokenCreateQuerySchema = z.object({
  use: z
    .string()
    .refine((val) => {
      const num = Number(val)

      return !isNaN(num) && num > 0 && num < 50
    }, 'Must be a number')
    .transform((val) => Number(val)),
})

// ==================================================================

export const ImageMetaSchema = z.object({
  height: z.number(),
  width: z.number(),
  format: ValidFormatSchema,
})

// ==================================================================

export const ImageGetFunSchema = z.object({
  cuid: z.string(),
  width: z.number(),
  height: z.number(),
  quality: z.number().min(1).max(100),
  format: ValidFormatSchema,
})

export type ImageGetFunType = z.infer<typeof ImageGetFunSchema>

export const ImageAddFunSchema = ImageGetFunSchema.extend({
  cid: z.string(),
  lastUsed: z.date(),
})

export type ImageAddFunType = z.infer<typeof ImageAddFunSchema>

export type CacheKeyGenFunType = ImageGetFunType
