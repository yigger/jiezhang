import type { RichTextProps } from '@tarojs/components'
import { parseDocument } from 'htmlparser2'

type ParsedNode = ReturnType<typeof parseDocument>['children'][number]
type SafeNode = RichTextProps.Text | RichTextProps.HTMLElement
const tags = new Set([
  'p',
  'div',
  'span',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'pre',
  'code',
  'img'
])

export function safeRichText(html: string): SafeNode[] {
  const convert = (nodes: ParsedNode[], depth = 0): SafeNode[] => {
    if (depth > 64) return []
    return nodes.flatMap((node): SafeNode[] => {
      if (node.type === 'text') return [{ type: 'text', text: node.data }]
      if (node.type !== 'tag' || !tags.has(node.name)) return []
      const attrs: Record<string, string> = {}
      if (node.name === 'img') {
        const src = node.attribs.src?.trim() ?? ''
        if (!/^(https?:\/\/|\/(?!\/))[^\s\\]+$/i.test(src)) return []
        attrs.src = src
        attrs.alt = node.attribs.alt ?? ''
      }
      return [{ type: 'node', name: node.name, attrs, children: convert(node.children, depth + 1) }]
    })
  }
  return convert(parseDocument(html).children)
}
