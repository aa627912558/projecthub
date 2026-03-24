/**
 * Image utilities for ProjectHub
 */

// Pollinations AI image service is currently down (301→404)
// Use this to detect and avoid broken cover images
export function isBrokenCoverImage(url: string | null | undefined): boolean {
  if (!url) return true
  if (url.includes('pollinations.ai')) return true
  return false
}

// Generate a deterministic seed from a string for picsum.photos
export function stringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Get a working cover image URL, falling back to deterministic picsum
export function getWorkingCoverImage(
  coverImage: string | null | undefined,
  title: string
): string {
  if (!isBrokenCoverImage(coverImage)) {
    return coverImage!
  }
  return `https://picsum.photos/seed/${stringToSeed(title)}/1200/630`
}
