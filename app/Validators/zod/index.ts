import { z } from 'zod'

const ValidFormatSchema = z.enum(['jpg', 'png', 'jpeg', 'webp', 'avif'])

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
