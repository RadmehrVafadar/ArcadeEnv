import { makeCatalog } from './catalog'

export const articles = makeCatalog(import.meta.glob('./content/**/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>)
export const assets = import.meta.glob('./content/**/*.{png,jpg,jpeg,gif,webp,svg,avif}', {
  query: '?url', import: 'default', eager: true,
}) as Record<string, string>
