export function generateStaticParams() {
  return ['login', 'login-ad', 'register', 'vocabulary', 'flashcards', 'quiz', 'history',
    'admin', 'admin/vocabulary', 'admin/categories', 'admin/users', 'admin/settings'].map(path => ({ slug: path.split('/') }))
}

export default function Page() {
  return null
}
