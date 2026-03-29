import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const file = url.searchParams.get('file') || ''
  
  if (!file || !file.startsWith('baidu_verify_') || !file.endsWith('.html')) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Try public directory first
  const publicPath = path.join(process.cwd(), 'public', file)
  if (fs.existsSync(publicPath)) {
    const content = fs.readFileSync(publicPath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }

  // Fallback: serve hardcoded content
  const code = file.replace('baidu_verify_', '').replace('.html', '')
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>verify</title>
</head>
<body>${code}</body>
</html>`
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
