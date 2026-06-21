export type SiteCategory = {
  id: string
  name: string
  description: string
  slug: string
}

/** Public listing / feed card (Neon-backed). */
export type FeedArticle = {
  id: string
  title: string
  excerpt: string
  /** ISO `YYYY-MM-DD` — used in `<time dateTime>`; format with `formatArticleDate`. */
  date: string
  categoryIds: string[]
  /** Hero image for cards (absolute URL or `/uploads/...`). */
  coverImageUrl?: string | null
  isMemberOnly: boolean
  /** JSON array of bullet-point highlights. */
  highlights?: string[]
}

/** Alias for components that imported `Article` for feed/list usage. */
export type Article = FeedArticle

/** Admin list row — advertise inquiries. */
export type AdminAdvertiseInquiryListItem = {
  id: string
  name: string
  email: string
  messagePreview: string
  status: string
  date: string
}

/** Admin list row (Neon-backed articles). */
export type AdminArticleListItem = {
  id: string
  title: string
  excerpt: string
  date: string
  categoryIds: string[]
  isPublished: boolean
  isMemberOnly: boolean
  views: number
  coverImageUrl: string | null
}

/** Admin list row — users. */
export type AdminUserListItem = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

/** Public banner ad (image + link). */
export type SiteAdPublic = {
  id: string
  imageUrl: string
  href: string
  name: string
}

/** Admin list row — site ads. */
export type AdminSiteAdListItem = {
  id: string
  name: string
  imageUrl: string | null
  href: string
  showOnHome: boolean
  showOnArticle: boolean
  isActive: boolean
  tier: string
}
