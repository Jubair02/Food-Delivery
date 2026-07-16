const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Neutral placeholder for menu images the admin app doesn't have locally.
export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" rx="8" fill="%23eef1f5"/><text x="50%25" y="55%25" font-size="9" fill="%239aa5b1" text-anchor="middle" font-family="sans-serif">no img</text></svg>'

export const foodImageUrl = (image) => {
  if (!image) return FALLBACK_IMG
  if (/^https?:\/\//.test(image)) return image // Cloudinary / remote URL
  return `${API_URL}/images/${image}` // local uploaded filename
}

export const money = (n) => `$${Number(n || 0).toFixed(2)}`

export const formatDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const STATUSES = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled']

export const statusClass = (status) =>
  `status-${(status || '').toLowerCase().replace(/ /g, '-')}`
