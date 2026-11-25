import '../styles.css'
import ClientApp from './client-app'

export const metadata = {
  title: 'Wordwise — Học tiếng Anh',
  description: 'Không gian học từ vựng tiếng Anh của bạn.',
}

export default function RootLayout({ children }) {
  return <html lang="vi"><body><ClientApp />{children}</body></html>
}
