import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Layers3, Library, History, Settings2, LogOut, PanelLeft, GraduationCap, ShieldCheck, ClipboardList } from 'lucide-react'
import { useState } from 'react'

const learner = [['/', 'Tổng quan', LayoutDashboard], ['/vocabulary', 'Từ vựng', Library], ['/flashcards', 'Thẻ ghi nhớ', Layers3], ['/quiz', 'Bài kiểm tra', ClipboardList], ['/history', 'Lịch sử học tập', History]]
const admin = [['/admin', 'Tổng quan quản trị', ShieldCheck], ['/admin/vocabulary', 'Quản lý từ vựng', BookOpen], ['/admin/categories', 'Chủ đề và cấp độ', Settings2]]
const settings = [['/admin/settings', 'Cài đặt quản trị', Settings2], ['/admin/users', 'Người dùng', GraduationCap]]
export default function Layout({ user, logout, children }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname().replace(/\/+$/, '') || '/'
  const links = items => items.map(([to, label, Icon]) => <Link key={to} href={to} onClick={() => setOpen(false)} className={`nav-link ${pathname === to ? 'active' : ''}`} aria-current={pathname === to ? 'page' : undefined}><Icon size={18}/>{label}</Link>)
  return <div className="app-shell"><a className="skip-link" href="#main">Chuyển đến nội dung</a>
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link href="/" className="brand"><span className="brand-mark"><BookOpen size={20}/></span><span>wordwise<small>TIẾNG ANH MỖI NGÀY</small></span></Link>
      <div className="nav-label">HỌC TẬP</div><nav aria-label="Học tập">{links(learner)}</nav>
      {user.is_staff && <><div className="nav-label admin-label">QUẢN LÝ</div><nav aria-label="Quản trị">{links(admin)}</nav></>}
      {user.is_superuser && <><div className="nav-label admin-label">PHÂN QUYỀN</div><nav aria-label="Cài đặt quản trị">{links(settings)}</nav></>}
      <div className="sidebar-bottom"><div className="avatar">{user.username?.[0]?.toUpperCase()}</div><div className="account"><strong>{user.username}</strong><span>{user.is_staff ? 'Quản trị viên' : 'Học viên'}</span></div><button className="icon-button" aria-label="Đăng xuất" onClick={logout}><LogOut size={18}/></button></div>
    </aside>
    <div className="main-wrap"><header className="topbar"><button className="menu-button icon-button" onClick={() => setOpen(!open)} aria-label="Mở hoặc đóng menu" aria-expanded={open}><PanelLeft size={21}/></button><span>Mỗi ngày tiến bộ qua từng từ mới.</span><span className="top-right"><span className="status-dot"/> Không gian học tập</span></header><main id="main" className="content">{children}</main></div>
  </div>
}
