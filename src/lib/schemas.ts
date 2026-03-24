// Custom refine for username: numbers cannot exceed half the total length
const usernameValidation = z.string()
  .min(2, '用户名至少2个字符')
  .max(12, '用户名最多12个字符')
  .regex(/^[\u4e00-\u9fa5a-zA-Z0-9]+$/, '用户名只能包含中文、英文、数字')

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  username: usernameValidation,
})
  .refine(
    (data) => {
      // Numbers cannot exceed half the total length (防纯数字账号)
      const numCount = (data.username.match(/[0-9]/g) || []).length
      return numCount <= Math.floor(data.username.length / 2)
    },
    {
      message: '数字不能超过用户名总长度的一半',
      path: ['username'],
    }
  )

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
  category: z.string().optional().default('副业'),
  cover_image: z.string().url('请输入有效的封面图URL').optional().or(z.literal('').transform(() => undefined)),
  project_url: z.string().url('请输入有效的项目链接').optional().or(z.literal('').transform(() => undefined)),
  tags: z
    .array(z.string().max(20))
    .max(6, '最多6个标签')
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
