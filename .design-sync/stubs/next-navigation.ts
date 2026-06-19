// design-sync stub for `next/navigation` — safe defaults so components that read
// the router/pathname render statically in a preview (no App Router context).
export const usePathname = (): string => '/'
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: async () => {},
})
export const useSearchParams = () => new URLSearchParams()
export const useParams = (): Record<string, string | string[]> => ({})
export const useSelectedLayoutSegment = (): string | null => null
export const useSelectedLayoutSegments = (): string[] => []
// Side-effecting helpers are no-ops here — never meant to fire during a preview render.
export const redirect = (): void => {}
export const permanentRedirect = (): void => {}
export const notFound = (): void => {}
