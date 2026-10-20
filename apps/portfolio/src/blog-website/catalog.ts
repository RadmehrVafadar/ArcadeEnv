import { fromMarkdown } from 'mdast-util-from-markdown'
import { toString } from 'mdast-util-to-string'

export type Article = { category: string; slug: string; title: string; body: string; path: string }

export function makeCatalog(files: Record<string, string>): Article[] {
  return Object.entries(files).map(([path, source]) => {
    const parts = path.replace('./content/', '').split('/')
    if (parts.length !== 2) throw new Error(`Articles must be inside one category folder: ${path}`)
    const [category, filename] = parts
    const slug = filename.replace(/\.md$/, '')
    const heading = fromMarkdown(source).children.find(node => node.type === 'heading' && node.depth === 1)
    const title = (heading && toString(heading)) || slug.replace(/[-_]/g, ' ')
    const body = heading?.position ? source.slice(0, heading.position.start.offset) + source.slice(heading.position.end.offset) : source
    return { category, slug, title, body, path }
  }).sort((a, b) => a.title.localeCompare(b.title, 'en'))
}

export function articleHref(article: Pick<Article, 'category' | 'slug'>) {
  return `#/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`
}

export function resolveLocal(value: string, article: Article, articles: Article[], assets: Record<string, string>) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value)) return value
  const url = new URL(value, `https://blog.local/${article.category}/${article.slug}.md`)
  let path: string
  try { path = `./content${decodeURIComponent(url.pathname)}` }
  catch { return value }
  const target = articles.find(item => item.path === path)
  return target ? articleHref(target) : assets[path] || value
}
