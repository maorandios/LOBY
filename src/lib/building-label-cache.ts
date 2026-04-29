const KEY_PREFIX = 'loby:buildingLabel:v1:'

/** Persists the feed header label across route changes and reloads until the tab ends. */
export function getCachedBuildingLabel(buildingId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(KEY_PREFIX + buildingId)
    return v && v.trim().length > 0 ? v.trim() : null
  } catch {
    return null
  }
}

export function setCachedBuildingLabel(buildingId: string, label: string): void {
  if (typeof window === 'undefined') return
  const t = label.trim()
  if (!t) return
  try {
    sessionStorage.setItem(KEY_PREFIX + buildingId, t)
  } catch {
    /* quota / private mode */
  }
}
