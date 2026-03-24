import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  username: z
    .string()
    .min(3, '用户名至少3位')
    .max(20, '用户名最多20位')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和短横线'),
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export const projectSchema = z.object({
  title: z
    .string()
    .min(3, '标题至少3个字')
    .max(100, '标题最多100字'),
  description: z
    .string()
    .min(10, '详细介绍至少10字')
    .max(10000, '详细介绍最多10000字'),
  cover_image: z.string().url('请输入有效的封面图URL').optional().or(z.literal('').transform(() => undefined)),
  project_url: z.string().url('请输入有效的项目链接').optional().or(z.literal('').transform(() => undefined)),
  tags: z
    .array(z.string().max(20))
    .max(5, '最多5个标签')
    .optional()
    .default([]),
  gallery: z
    .array(z.string().url())
    .max(10, '最多10张截图')
    .optional()
    .default([]),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProjectInput = z.infer<typeof projectSchema>
