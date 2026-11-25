import { useEffect, useState } from 'react'
import { Refine, useLogin, useLogout, useRegister } from '@refinedev/core'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { authProvider, dataProvider } from './services/refine'
import Layout from './components/Layout'
import { TextField } from './components/UI'
import { fixtureMode } from './services/api'
import { Dashboard, Vocabulary, Flashcards, Quiz, History, AdminDashboard, AdminWords, AdminCategories } from './pages'
import AdminSettings from './AdminSettings'
import AdminUsers from './AdminUsers'

function Auth({ register, adminLogin, onLogin }) {
  const router = useRouter()
  const { mutateAsync: login } = useLogin()
  const { mutateAsync: registerAccount } = useRegister()
  const [values, setValues] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setError('')
    if (values.password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.')
    if (register && values.password !== values.confirm) return setError('Mật khẩu xác nhận không khớp.')
    setBusy(true)
    try {
      const result = register
        ? await registerAccount({ username: values.username, email: values.email, password: values.password })
        : await login({ username: values.username, password: values.password })
      if (!result.success) throw result.error || new Error('Không thể thực hiện yêu cầu.')
      if (register) setNotice('Đã tạo tài khoản. Bạn có thể đăng nhập.')
      else {
        const identity = await authProvider.getIdentity()
        if (adminLogin && !identity.is_staff) {
          await authProvider.logout()
          throw new Error('Tài khoản này không có quyền quản trị. Hãy đăng nhập tại trang học viên.')
        }
        if (!adminLogin && identity.is_staff) {
          await authProvider.logout()
          throw new Error('Tài khoản quản trị cần đăng nhập tại /login-ad.')
        }
        onLogin(identity); router.push('/')
      }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const field = name => ({ value: values[name], onChange: e => setValues({ ...values, [name]: e.target.value }), required: true })
  return <div className="auth-page"><div className="auth-intro"><Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>wordwise<small>TIẾNG ANH MỖI NGÀY</small></span></Link><div><span className="eyebrow">MỖI NGÀY MỘT CHÚT</span><h1>Dành chỗ cho<br/><em>những từ mới.</em></h1><p>Không gian để học, ôn tập và làm chủ tiếng Anh.</p></div><span className="auth-footer">Tự tin hơn mỗi ngày.</span></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><span className="eyebrow">KHÔNG GIAN HỌC TẬP</span><h2>{register ? 'Tạo tài khoản' : adminLogin ? 'Đăng nhập quản trị' : 'Chào mừng trở lại'}</h2><p>{register ? 'Bắt đầu xây dựng vốn từ vựng của bạn.' : 'Tiếp tục hành trình học tập của bạn.'}</p>{fixtureMode && <div className="notice">Chế độ dữ liệu thử: dùng “learner” hoặc “admin”; thay đổi chỉ là tạm thời.</div>}{error && <div role="alert" className="form-error">{error}</div>}{notice && <div role="status" className="notice">{notice}</div>}<TextField label="Tên đăng nhập" autoComplete="username" {...field('username')}/>{register && <TextField label="Email" type="email" autoComplete="email" {...field('email')}/>}<TextField label="Mật khẩu" type="password" autoComplete={register ? 'new-password' : 'current-password'} {...field('password')}/>{register && <TextField label="Xác nhận mật khẩu" type="password" autoComplete="new-password" {...field('confirm')}/>}<button className="button full" type="submit" disabled={busy}>{register ? 'Tạo tài khoản' : 'Đăng nhập'} <span>→</span></button><div className="auth-switch">{register ? 'Đã có tài khoản?' : 'Bạn mới đến Wordwise?'} <Link href={register ? '/login' : '/register'}>{register ? 'Đăng nhập' : 'Tạo tài khoản'}</Link></div>{!register && <div className="auth-switch"><Link href={adminLogin ? '/login' : '/login-ad'}>{adminLogin ? 'Đăng nhập học viên' : 'Đăng nhập quản trị'}</Link></div>}</form></div></div>
}

function AppContent() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const path = usePathname().replace(/\/+$/, '') || '/'
  const { mutateAsync: logoutRequest } = useLogout()
  async function logout() { try { await logoutRequest({}) } finally { setUser(null); router.replace(user?.is_staff ? '/login-ad' : '/login') } }
  const publicPage = path === '/login' || path === '/login-ad' || path === '/register'
  const allowed = user && (!path.startsWith('/admin') || user.is_staff) && (!['/admin/settings', '/admin/users'].includes(path) || user.is_superuser)
  useEffect(() => {
    if (!user && !publicPage) router.replace('/login')
    else if (user && (publicPage || !allowed)) router.replace('/')
  }, [user, publicPage, allowed, router])
  if (!user) return publicPage ? <Auth key={path} register={path === '/register'} adminLogin={path === '/login-ad'} onLogin={setUser}/> : null
  if (publicPage || !allowed) return null
  const pages = { '/': <Dashboard user={user}/>, '/vocabulary': <Vocabulary/>, '/flashcards': <Flashcards/>, '/quiz': <Quiz/>, '/history': <History/>, '/admin': <AdminDashboard/>, '/admin/vocabulary': <AdminWords/>, '/admin/categories': <AdminCategories/>, '/admin/users': <AdminUsers/>, '/admin/settings': <AdminSettings/> }
  return <Layout user={user} logout={logout}>{fixtureMode && <div className="fixture-banner">Dữ liệu thử nghiệm · thay đổi sẽ mất khi tải lại</div>}{pages[path] || <div className="state">Không tìm thấy trang.</div>}</Layout>
}

export default function App() {
  return <Refine authProvider={authProvider} dataProvider={dataProvider} resources={['vocabulary', 'categories', 'levels', 'reviews', 'quizzes'].map(name => ({ name }))} options={{ disableTelemetry: true }}><AppContent /></Refine>
}
