/** Routes that use the main feed bottom tab bar + FAB (not post detail, profile, or building admin). */
export function feedShowsBottomTabBar(pathname: string): boolean {
  if (pathname.startsWith('/post/') && /^\/post\/[^/]+$/.test(pathname)) {
    return false
  }
  if (pathname === '/profile') return false
  if (pathname === '/building' || pathname.startsWith('/building/')) {
    return false
  }
  return true
}
