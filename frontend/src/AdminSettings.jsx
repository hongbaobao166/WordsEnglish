import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDataProvider } from '@refinedev/core'
import { Card, PageHeader, State, TextField } from './components/UI'
import { results } from './services/api'

const resourceNames = { vocabulary: 'Từ vựng', category: 'Chủ đề', cefrlevel: 'Cấp độ' }
const actionNames = { add: 'Thêm', change: 'Sửa', delete: 'Xóa' }

export default function AdminSettings() {
  const api = useDataProvider()().learning
  const [data, setData] = useState(null)
  const [editor, setEditor] = useState({ name: '', permissions: [] })
  const [assignments, setAssignments] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let live = true
    Promise.all([api.roles(), api.permissions(), api.users()]).then(([roles, permissions, users]) => {
      if (!live) return
      const list = results(users)
      setData({ roles: results(roles), permissions, users: list, moreUsers: !!users.next, moreRoles: !!roles.next })
      setAssignments(Object.fromEntries(list.map(user => [user.id, user.groups || []])))
    }).catch(err => live && setError(err.message))
    return () => { live = false }
  }, [api, version])
  const reload = () => setVersion(v => v + 1)
  const toggle = (values, id) => values.includes(id) ? values.filter(value => value !== id) : [...values, id]
  async function saveRole(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await api.saveRole(editor.id, { name: editor.name.trim(), permissions: editor.permissions })
      setEditor({ name: '', permissions: [] }); setNotice('Đã lưu vai trò.'); reload()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function removeRole(role) {
    if (!window.confirm(`Xóa vai trò “${role.name}”? Quyền của người dùng thuộc vai trò này sẽ thay đổi.`)) return
    setError(''); setNotice('')
    try { await api.deleteRole(role.id); setNotice('Đã xóa vai trò.'); reload() }
    catch (err) { setError(err.message) }
  }
  async function saveUser(user) {
    setError(''); setNotice('')
    try { await api.saveUser(user.id, { groups: assignments[user.id] || [] }); setNotice(`Đã cập nhật vai trò cho ${user.username}.`); reload() }
    catch (err) { setError(err.message) }
  }
  return <><PageHeader eyebrow="CÀI ĐẶT QUẢN TRỊ" title="Vai trò và phân quyền" description="Tạo vai trò, chọn quyền theo tài nguyên và gán vai trò cho tài khoản."/>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="notice" role="status">{notice}</div>}
    <State loading={!data && !error} error={error && !data ? error : ''}>
      {data && <div className="history-grid"><Card className="editor">
        <h2>{editor.id ? 'Sửa vai trò' : 'Bước 1: Tạo vai trò'}</h2>
        <p>Ví dụ: đặt tên “Người nhập từ”, chọn quyền Thêm ở phần Từ vựng, rồi bấm Lưu vai trò.</p>
        <form onSubmit={saveRole}><TextField label="Tên vai trò" value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })} required maxLength={150}/>
          {Object.entries(resourceNames).map(([resource, label]) => <fieldset className="role-fieldset" key={resource}><legend>{label}</legend>
            {data.permissions.filter(p => p.content_type__model === resource).map(permission => <label className="role-option" key={permission.id}><input type="checkbox" checked={editor.permissions.includes(permission.id)} onChange={() => setEditor({ ...editor, permissions: toggle(editor.permissions, permission.id) })}/>{actionNames[permission.codename.split('_')[0]]}</label>)}
          </fieldset>)}
          <div className="admin-actions"><button className="button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu vai trò'}</button>{editor.id && <button type="button" className="button secondary" onClick={() => setEditor({ name: '', permissions: [] })}>Hủy</button>}</div>
        </form>
        <h2>Vai trò hiện có</h2>{!data.roles.length && <p>Chưa có vai trò. Hãy tạo vai trò bằng biểu mẫu phía trên.</p>}{data.roles.map(role => <div className="history-row" key={role.id}><strong>{role.name}</strong><div><button type="button" className="text-link" onClick={() => setEditor({ id: role.id, name: role.name, permissions: role.permissions })}>Sửa</button>{' '}<button type="button" className="text-link" onClick={() => removeRole(role)}>Xóa</button></div></div>)}
        {data.moreRoles && <p>Chỉ hiển thị trang đầu vai trò.</p>}
      </Card><Card className="editor"><h2>Bước 2: Gán vai trò</h2><p>Chọn vai trò bên dưới tên người dùng, sau đó bấm Lưu. Cũng có thể gán trong <Link className="text-link" href="/admin/users">Quản lý người dùng</Link>.</p>
        {!data.roles.length && <p>Chưa có vai trò để chọn. Hoàn thành bước 1 trước, sau đó quay lại phần này.</p>}
        {data.users.filter(user => !user.is_superuser).map(user => <div className="role-user" key={user.id}><strong>{user.username}</strong><div>{data.roles.map(role => <label className="role-option" key={role.id}><input type="checkbox" checked={(assignments[user.id] || []).includes(role.id)} onChange={() => setAssignments({ ...assignments, [user.id]: toggle(assignments[user.id] || [], role.id) })}/>{role.name}</label>)}</div><button type="button" className="button secondary" disabled={!data.roles.length} onClick={() => saveUser(user)}>Lưu vai trò cho {user.username}</button></div>)}
        {data.moreUsers && <p>Chỉ hiển thị trang đầu người dùng.</p>}
      </Card></div>}
    </State>
  </>
}
