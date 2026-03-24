/**
 * 内容审核模块
 * 检测违规内容：联系方式、外部链接、地址等
 */

export interface ModerationResult {
  isClean: boolean
  flaggedContent: FlaggedItem[]
  sanitizedContent: SanitizedContent
  reason: string
}

export interface FlaggedItem {
  type: 'phone' | 'wechat' | 'qq' | 'email' | 'url' | 'address' | 'other'
  original: string
  replacement: string
  field: string
}

export interface SanitizedContent {
  title: string
  description: string
  project_url: string
  cover_image: string
  category: string
}

// 违规检测正则
const PATTERNS = {
  // 手机号（中国大陆）
  phone: /1[3-9]\d{9}/g,
  
  // 微信号（通常6-20位，字母数字下划线）
  wechat: /(?:微[信​]?|wechat|wx)[:：]?\s*[@]?[a-zA-Z][a-zA-Z0-9_-]{5,19}/gi,
  wechatSimple: /wx[_-]?[a-zA-Z0-9]{6,20}/gi,
  
  // QQ号
  qq: /(?:QQ|qq)[：:\s]*\d{5,12}/g,
  qqNumber: /\d{5,12}(?:[qQ]{2}|[Q]{2})/g,
  
  // 邮箱
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // 外部URL（排除项目派自己的域名）
  url: /https?:\/\/(?!.*(xiangmupai|localhost))(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(\/[^\s]*)?/gi,
  
  // 地址关键词
  address: /(?:地址|location|addr|位于|坐落于)[:：]?\s*.{5,50}/gi,
  
  // 更多联系方式关键词
  contact: /(?:联系|contact|联系方式|手机|电话|微信|QQ)[：:\s]*.{3,30}/gi,
}

// 违规关键词
const FLAG_WORDS = [
  '加我', '加微信', '加QQ', '私聊', '私信', '联系我',
  '看主页', '点击主页', '访问主页',
  '公众号', 'gzh', ' GongZhongHao',
  '代搭建', '代开发', '付费', '收费', 'money',
]

/**
 * 审核单条内容
 */
function moderateText(text: string, fieldName: string): FlaggedItem[] {
  const flagged: FlaggedItem[] = []
  if (!text) return flagged

  // 检测手机号
  let match
  const phoneRegex = new RegExp(PATTERNS.phone.source, 'g')
  while ((match = phoneRegex.exec(text)) !== null) {
    flagged.push({
      type: 'phone',
      original: match[0],
      replacement: '***',
      field: fieldName,
    })
  }

  // 检测微信号
  const wechatRegex = new RegExp(PATTERNS.wechat.source + '|' + PATTERNS.wechatSimple.source, 'gi')
  while ((match = wechatRegex.exec(text)) !== null) {
    const cleaned = match[0].replace(/[^\w]/g, '')
    if (cleaned.length >= 6) {
      flagged.push({
        type: 'wechat',
        original: match[0],
        replacement: '***',
        field: fieldName,
      })
    }
  }

  // 检测QQ号
  const qqRegex = new RegExp(PATTERNS.qq.source + '|' + PATTERNS.qqNumber.source, 'g')
  while ((match = qqRegex.exec(text)) !== null) {
    const num = match[0].replace(/[qQ]/g, '')
    if (/^\d{5,12}$/.test(num)) {
      flagged.push({
        type: 'qq',
        original: match[0],
        replacement: '***',
        field: fieldName,
      })
    }
  }

  // 检测邮箱
  const emailRegex = new RegExp(PATTERNS.email.source, 'g')
  while ((match = emailRegex.exec(text)) !== null) {
    flagged.push({
      type: 'email',
      original: match[0],
      replacement: '***',
      field: fieldName,
    })
  }

  // 检测外部URL
  const urlRegex = new RegExp(PATTERNS.url.source, 'gi')
  while ((match = urlRegex.exec(text)) !== null) {
    flagged.push({
      type: 'url',
      original: match[0],
      replacement: '[外部链接已屏蔽]',
      field: fieldName,
    })
  }

  // 检测地址
  const addrRegex = new RegExp(PATTERNS.address.source, 'gi')
  while ((match = addrRegex.exec(text)) !== null) {
    flagged.push({
      type: 'address',
      original: match[0],
      replacement: '[地址已屏蔽]',
      field: fieldName,
    })
  }

  // 检测联系方式关键词
  const contactRegex = new RegExp(PATTERNS.contact.source, 'gi')
  while ((match = contactRegex.exec(text)) !== null) {
    flagged.push({
      type: 'other',
      original: match[0],
      replacement: '[联系方式已屏蔽]',
      field: fieldName,
    })
  }

  // 检测违规关键词
  for (const word of FLAG_WORDS) {
    const regex = new RegExp(word, 'gi')
    while ((match = regex.exec(text)) !== null) {
      flagged.push({
        type: 'other',
        original: match[0],
        replacement: '***',
        field: fieldName,
      })
    }
  }

  return flagged
}

/**
 * 替换内容中的违规部分
 */
function sanitizeText(text: string, flagged: FlaggedItem[], fieldName: string): string {
  let result = text
  const fieldFlagged = flagged.filter(f => f.field === fieldName)
  
  // 按原始长度降序排列，避免替换后位置偏移
  fieldFlagged.sort((a, b) => b.original.length - a.original.length)
  
  for (const item of fieldFlagged) {
    result = result.replace(item.original, item.replacement)
  }
  
  return result
}

/**
 * 审核项目内容
 */
export function moderateProject(content: {
  title: string
  description: string
  project_url: string
  cover_image?: string
  category?: string
}): ModerationResult {
  const allFlagged: FlaggedItem[] = []

  // 审核各个字段
  allFlagged.push(...moderateText(content.title, 'title'))
  allFlagged.push(...moderateText(content.description, 'description'))
  allFlagged.push(...moderateText(content.project_url, 'project_url'))
  if (content.cover_image) {
    allFlagged.push(...moderateText(content.cover_image, 'cover_image'))
  }

  // 去重（基于original）
  const uniqueFlagged = allFlagged.reduce((acc, item) => {
    const exists = acc.find(f => f.original === item.original)
    if (!exists) {
      acc.push(item)
    }
    return acc
  }, [] as FlaggedItem[])

  // 生成净化内容
  const sanitizedContent: SanitizedContent = {
    title: sanitizeText(content.title, uniqueFlagged, 'title'),
    description: sanitizeText(content.description, uniqueFlagged, 'description'),
    project_url: sanitizeText(content.project_url, uniqueFlagged, 'project_url'),
    cover_image: content.cover_image || '',
    category: content.category || '',
  }

  // 生成原因描述
  let reason = ''
  if (uniqueFlagged.length > 0) {
    const types = Array.from(new Set(uniqueFlagged.map(f => f.type)))
    const typeNames: Record<string, string> = {
      phone: '手机号',
      wechat: '微信号',
      qq: 'QQ号',
      email: '邮箱',
      url: '外部链接',
      address: '地址',
      other: '其他联系方式',
    }
    reason = types.map(t => typeNames[t] || t).join('、')
  }

  return {
    isClean: uniqueFlagged.length === 0,
    flaggedContent: uniqueFlagged,
    sanitizedContent,
    reason,
  }
}

/**
 * 获取违规类型的友好名称
 */
export function getFlagTypeName(type: FlaggedItem['type']): string {
  const names: Record<FlaggedItem['type'], string> = {
    phone: '手机号',
    wechat: '微信号',
    qq: 'QQ号',
    email: '邮箱',
    url: '外部链接',
    address: '地址',
    other: '其他联系方式',
  }
  return names[type] || type
}
