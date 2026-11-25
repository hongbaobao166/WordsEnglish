import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('next/link', async () => {
  const React = await import('react')
  const { Link } = await import('react-router-dom')
  return { default: ({ href, children, ...props }) => React.createElement(Link, { ...props, to: href }, children) }
})
vi.mock('next/navigation', async () => {
  const React = await import('react')
  const { useLocation, useNavigate } = await import('react-router-dom')
  return {
    usePathname: () => useLocation().pathname,
    useRouter: () => {
      const navigate = useNavigate()
      return React.useMemo(() => ({ push: path => navigate(path), replace: path => navigate(path, { replace: true }) }), [navigate])
    },
  }
})
