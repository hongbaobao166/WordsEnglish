import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
export function PageHeader({ eyebrow, title, description, action }) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section> }
export function State({ loading, error, empty, children }) { if (loading) return <div className="state" role="status">Đang tải dữ liệu…</div>; if (error) return <div className="state error" role="alert">{error}</div>; if (empty) return <div className="state">Chưa có dữ liệu.</div>; return children }
export function TextField({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props}/></label> }
export function ActionLink({ to, children, className = '' }) { return <Link className={`button ${className}`} href={to}>{children}<ArrowRight size={16}/></Link> }
export function badgeClass(level) { return `badge level-${level}` }
