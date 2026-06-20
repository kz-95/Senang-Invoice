// design-sync stub for `next/link` — renders a plain anchor so layout/nav
// components bundle and render statically (no Next router needed for a preview).
import * as React from 'react'

type LinkProps = {
  href?: string | { pathname?: string }
  children?: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export default function Link({ href, children, ...rest }: LinkProps) {
  const h = typeof href === 'string' ? href : href?.pathname ?? '#'
  return (
    <a href={h} {...rest}>
      {children}
    </a>
  )
}
