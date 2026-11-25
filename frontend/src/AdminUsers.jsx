import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDataProvider } from '@refinedev/core'
import { Card, PageHeader, State } from './components/UI'
import { results } from './services/api'

export default function AdminUsers() {
  const api = useDataProvider()().learning
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let live = true
    setData(null)
    Promise.all([api.users(page), api.roles()]).then(([users, roles]) => {
      if (live) setData({ users: results(users), next: users.next, roles: results(roles) })
    }).catch(err => live && setError(err.message))
    return () => { live = false }
  }, [api, page, version])
  async function save() {
    setBusy(true); setError(''); setNotice('')
    try {
      await api.saveUser(selected.id, { groups })
      setNotice(`Đã cập nhật vai trò cho ${selected.username}.`)
      setSelected(null); setVersion(v => v + 1)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function toggleStatus(user) {
    if (!window.confirm(`${user.is_active ? 'Khóa' : 'Mở khóa'} tài khoản ${user.username}?`)) return
    setError(''); setNotice('')
    try { await api.saveUser(user.id, { is_active: !user.is_active }); setNotice('Đã cập nhật trạng thái tài khoản.'); setVersion(v => v + 1) }
    catch (err) { setError(err.message) }
  }
  return <><PageHeader eyebrow="QUẢN LÝ / NGƯỜI DÙNG" title="Quản lý người dùng" description="Xem tài khoản, gán vai trò đã tạo và quản lý trạng thái."/>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="notice" role="status">{notice}</div>}
    <State loading={!data && !error} error={!data ? error : ''}>
      {data && <><Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Tên đăng nhập</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
        {data.users.map(user => <tr key={user.id}><td><strong>{user.username}</strong></td><td>{user.email || '—'}</td><td>{user.is_superuser ? 'Superadmin' : (user.groups || []).map(id => data.roles.find(role => role.id === id)?.name || `Vai trò #${id}`).join(', ') || 'Học viên (chưa có vai trò)'}</td><td>{user.is_active ? 'Đang hoạt động' : 'Đã khóa'}</td><td>{!user.is_superuser && <><button className="text-link" onClick={() => { setSelected(user); setGroups(user.groups || []); setError(''); setNotice('') }}>Gán vai trò</button>{' '}<button className="text-link" onClick={() => toggleStatus(user)}>{user.is_active ? 'Khóa' : 'Mở khóa'}</button></>}</td></tr>)}
      </tbody></table></div><div className="pagination"><button disabled={page === 1} onClick={() => { setSelected(null); setPage(page - 1) }}>Trước</button><span>Trang {page}</span><button disabled={!data.next} onClick={() => { setSelected(null); setPage(page + 1) }}>Tiếp</button></div></Card>
      {selected && <Card className="editor"><h2>Gán vai trò cho {selected.username}</h2><p>Chọn một hoặc nhiều vai trò. Bỏ chọn tất cả để đưa tài khoản về học viên.</p>
        {!data.roles.length ? <p>Chưa có vai trò. Hãy <Link className="text-link" href="/admin/settings">tạo vai trò trong Cài đặt quản trị</Link> trước.</p> : <fieldset className="role-fieldset"><legend>Vai trò</legend>{data.roles.map(role => <label className="role-option" key={role.id}><input type="checkbox" checked={groups.includes(role.id)} onChange={() => setGroups(current => current.includes(role.id) ? current.filter(id => id !== role.id) : [...current, role.id])}/>{role.name}</label>)}</fieldset>}
        <div className="admin-actions"><button className="button" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu vai trò'}</button><button className="button secondary" onClick={() => setSelected(null)}>Hủy</button></div>
      </Card>}</>}
    </State>
  </>
}
