import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { articles, assets } from './content'
import { articleHref, resolveLocal } from './catalog'
import './blog.css'
import { installCabinetNavigation } from '../cabinet-navigation'

const categories = [...new Set(['tech', 'hobbies', 'work', ...articles.map(article => article.category)])]

export default function Blog() {
  const [hash, setHash] = useState(window.location.hash)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  let parts: string[]
  try { parts = decodeURIComponent(hash.replace(/^#\/?/, '')).split('/').filter(Boolean) }
  catch { parts = ['invalid'] }
  const [category, slug] = parts
  const home = parts.length === 0
  const article = parts.length === 2 ? articles.find(item => item.category === category && item.slug === slug) : undefined
  const missing = !home && (!categories.includes(category) || parts.length > 2 || (slug && !article))
  const title = missing ? 'Not found' : home ? "rad's blog" : article?.title || category
  useEffect(() => {
    document.title = home ? title : `${title} · rad's blog`
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [hash, title, home])
  // Cabinet selection must take focus after the standalone heading focus runs.
  useEffect(() => installCabinetNavigation(document.getElementById('blog-root')!, import.meta.env.BASE_URL), [hash])

  return <main className={home ? 'blog home' : 'blog directory'}>
    {home ? <>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      <nav aria-label="Folders"><ul className="folders">{categories.map(name =>
        <li key={name}><a href={`#/${encodeURIComponent(name)}`}>/{name}</a></li>)}
        <li><a data-cabinet-back href={import.meta.env.BASE_URL} aria-label="Back to portfolio menu">../</a></li>
      </ul></nav>
    </> : <>
      {(!article || missing) && <h1 className="folder-title" ref={heading} tabIndex={-1}>{title}</h1>}
      <nav className="parent" aria-label="Parent folder"><a data-cabinet-back href={article ? `#/${encodeURIComponent(category)}` : '#/'} aria-label={article ? `Back to ${category}` : 'Back to blog'}>../</a></nav>
      {missing ? <p className="empty">This page could not be found.</p> : article ?
        <article className="prose" data-cabinet-scroll>
          <h1 ref={heading} tabIndex={-1}>{article.title}</h1>
          <Markdown remarkPlugins={[remarkGfm]} skipHtml components={{
            a: ({ href, children, ...props }) => <a {...props} href={resolveLocal(href || '', article, articles, assets)}>{children}</a>,
            img: ({ src, alt, ...props }) => <img {...props} src={resolveLocal(src || '', article, articles, assets)} alt={alt || ''} loading="lazy" />,
            table: ({ children }) => <div className="table-scroll" tabIndex={0} role="region" aria-label="Table"><table>{children}</table></div>,
          }}>{article.body}</Markdown>
        </article> : articles.some(item => item.category === category) ?
          <ul className="articles" data-cabinet-default>{articles.filter(item => item.category === category).map(item =>
            <li key={item.slug}><a href={articleHref(item)}>{item.title}</a></li>)}</ul> :
          <p className="empty">No articles yet.</p>}
    </>}
  </main>
}

createRoot(document.getElementById('blog-root')!).render(<Blog />)
