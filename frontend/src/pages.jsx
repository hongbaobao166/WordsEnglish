import { useEffect, useState } from 'react'
import { useDataProvider, useList } from '@refinedev/core'
import Link from 'next/link'
import { ArrowRight, BookOpen, Layers3, Sparkles, Target, Volume2, Search, RotateCcw, Plus, Pencil, Trash2 } from 'lucide-react'
import { results } from './services/api'
import { PageHeader, Card, State, TextField, ActionLink, badgeClass } from './components/UI'

function useLoad(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [version, setVersion] = useState(0)
  useEffect(() => { let live = true; setState({ loading: true, data: null, error: '' }); Promise.resolve().then(loader).then(data => live && setState({ loading: false, data, error: '' })).catch(e => live && setState({ loading: false, data: null, error: e.message })); return () => { live = false } }, [...deps, version])
  return { ...state, reload: () => setVersion(v => v + 1) }
}
const useApi = () => useDataProvider()().learning
const count = (data, ...keys) => keys.map(k => data?.[k]).find(v => v !== undefined) ?? '—'
function Stats({ items }) { return <div className="stats-grid">{items.map(([label, value, icon, tone, hint]) => <Card className="stat" key={label}><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-hint">{hint}</div></Card>)}</div> }
export function Dashboard({ user }) {
  const api = useApi()
  const dashboard = useLoad(() => api.dashboard())
  const vocabulary = useList({ resource: 'vocabulary', meta: { userId: user.id ?? user.username }, pagination: { currentPage: 1, pageSize: 20 } })
  const state = { loading: dashboard.loading || vocabulary.query.isLoading, error: dashboard.error || vocabulary.query.error?.message || '', data: [dashboard.data, { results: vocabulary.result.data }] }
  return <><PageHeader eyebrow="TỔNG QUAN HỌC TẬP" title={`Xin chào, ${user.username}.`} description="Tiến bộ từng chút mỗi ngày."/><State {...state}><Stats items={[[ 'Từ vựng', count(state.data?.[0], 'total', 'catalog_total'), <BookOpen size={19}/>, 'mint', 'Trong thư viện'], ['Cần ôn tập', count(state.data?.[0], 'due', 'due_count'), <Layers3 size={19}/>, 'peach', 'Ôn tập để nhớ lâu'], ['Đang học', count(state.data?.[0], 'learning', 'learning_count'), <Sparkles size={19}/>, 'blue', 'Tiếp tục cố gắng'], ['Đã ghi nhớ', count(state.data?.[0], 'mastered', 'mastered_count'), <Target size={19}/>, 'yellow', 'Vốn từ của bạn']]}/>
  <div className="dashboard-grid"><Card className="feature-card"><div className="feature-copy"><span className="eyebrow">DÀNH THỜI GIAN CHO BẠN</span><h2>Từng bước nhỏ.<br/><em>Vốn từ rộng mở.</em></h2><p>Xây dựng thói quen học tập chỉ với vài phút mỗi ngày.</p><ActionLink to="/flashcards">Bắt đầu ôn tập</ActionLink></div><div className="feature-art" aria-hidden="true"><span>Aa</span><i>✳</i><div>mỗi ngày<br/>một từ mới.</div></div></Card><Card className="next-card"><div className="section-heading"><div><span className="eyebrow">TIẾP TỤC CỐ GẮNG</span><h2>Tạo thói quen học tập</h2></div><span className="circle-icon"><Sparkles size={19}/></span></div><p>Ôn tập thường xuyên giúp bạn ghi nhớ từ lâu hơn.</p><div className="next-links"><Link href="/vocabulary"><span><BookOpen size={18}/> Khám phá từ vựng</span><ArrowRight size={17}/></Link><Link href="/quiz"><span><Target size={18}/> Làm bài kiểm tra</span><ArrowRight size={17}/></Link></div></Card></div>
  <div className="section-heading recent-heading"><div><span className="eyebrow">KHÁM PHÁ</span><h2>Từ vựng mới</h2></div><Link className="text-link" href="/vocabulary">Xem tất cả từ vựng <ArrowRight size={16}/></Link></div><div className="word-grid">{results(state.data?.[1]).slice(0, 3).map(w => <WordCard key={w.id} word={w}/>)}</div></State></>
}
function WordCard({ word }) { return <Card className="word-card"><div className="word-top"><span className={badgeClass(word.level_code || word.level)}>{word.level_code || word.level}</span>{word.audio_url && <button className="icon-button" aria-label={`Phát âm ${word.word}`} onClick={() => new Audio(word.audio_url).play()}><Volume2 size={18}/></button>}</div><h3>{word.word}</h3><div className="phonetic">{word.phonetic}</div><p>{word.meaning_en}</p><div className="translation">{word.meaning_vi}</div>{word.example_sentence && <div className="example">“{word.example_sentence}”</div>}</Card> }
export function Vocabulary() {
  const api = useApi()
  const [search, setSearch] = useState(''); const [level, setLevel] = useState(''); const [category, setCategory] = useState('')
  const state = useLoad(() => Promise.all([api.vocabulary({ search, level, category }), api.categories()]), [search, level, category])
  return <><PageHeader eyebrow="THƯ VIỆN TỪ VỰNG" title="Tìm từ vựng tiếp theo." description="Khám phá tiếng Anh qua từng từ hữu ích."/><div className="filters"><label className="search-box"><Search size={18}/><span className="sr-only">Tìm từ</span><input placeholder="Tìm từ hoặc nghĩa..." value={search} onChange={e => setSearch(e.target.value)}/></label><label><span className="sr-only">Cấp độ</span><select value={level} onChange={e => setLevel(e.target.value)}><option value="">Tất cả cấp độ</option>{['A1','A2','B1','B2','C1','C2'].map(x => <option key={x}>{x}</option>)}</select></label><label><span className="sr-only">Chủ đề</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="">Tất cả chủ đề</option>{results(state.data?.[1]).map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div><State {...state} empty={!results(state.data?.[0]).length}><div className="list-meta">{state.data?.[0]?.count ?? results(state.data?.[0]).length} từ được tìm thấy</div><div className="word-grid">{results(state.data?.[0]).map(w => <WordCard key={w.id} word={w}/>)}</div></State></>
}
export function Flashcards() {
  const api = useApi()
  const state = useLoad(() => api.due()); const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [error, setError] = useState('')
  const words = results(state.data); const word = words[index]
  async function rate(rating) { try { await api.review(word.id, rating); setIndex(index + 1); setFlipped(false); setError('') } catch (e) { setError(e.message) } }
  return <><PageHeader eyebrow="LUYỆN TẬP HẰNG NGÀY" title="Ôn tập mỗi ngày để nhớ lâu." description="Hãy học theo nhịp độ của bạn, không cần vội vàng."/><State {...state}><div className="practice-wrap">{word ? <><div className="practice-meta"><span>PHIÊN ÔN TẬP</span><span>{index + 1} / {words.length}</span></div><div className="progress-track"><span style={{ width: `${index / words.length * 100}%` }}/></div><button type="button" className={`flashcard ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-pressed={flipped} aria-label={flipped ? `Nghĩa của ${word.word}: ${word.meaning_en}, ${word.meaning_vi}. Nhấn để xem từ` : `Từ này nghĩa là gì: ${word.word}. Nhấn để xem nghĩa`}><span className="flashcard-inner"><span className="flashcard-face flashcard-front" aria-hidden="true"><span className="eyebrow">TỪ NÀY NGHĨA LÀ GÌ?</span><strong>{word.word}</strong><span>{word.phonetic}</span><small><RotateCcw size={15}/> Nhấn để xem nghĩa</small></span><span className="flashcard-face flashcard-back" aria-hidden="true"><span className="eyebrow">NGHĨA CỦA TỪ</span><strong>{word.meaning_en}</strong><span>{word.meaning_vi}</span><small><RotateCcw size={15}/> Nhấn để xem từ</small></span></span></button>{error && <div className="form-error" role="alert">{error}</div>}{flipped && <div className="rating"><p>Bạn nhớ từ này như thế nào?</p><div>{['again','hard','good','easy'].map(r => <button className="button secondary" key={r} onClick={() => rate(r)}>{({ again: 'Học lại', hard: 'Khó', good: 'Tốt', easy: 'Dễ' })[r]}</button>)}</div></div>}</> : <div className="state">Bạn đã ôn tập xong. <Link href="/vocabulary">Khám phá thêm từ vựng →</Link></div>}</div></State></>
}
export function Quiz() {
  const api = useApi()
  const [quiz, setQuiz] = useState(null); const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function start() { setLoading(true); setError(''); try { setQuiz(await api.createQuiz()); setAnswers({}); setResult(null) } catch (e) { setError(e.message) } finally { setLoading(false) } }
  async function submit(e) { e.preventDefault(); if (Object.keys(answers).length !== quiz.questions.length) return setError('Hãy chọn đáp án cho tất cả câu hỏi.'); try { setResult(await api.submitQuiz(quiz.id, Object.entries(answers).map(([question_id, selected_option]) => ({ question_id: Number(question_id), selected_option })))); setError('') } catch (err) { setError(err.message) } }
  return <><PageHeader eyebrow="THỰC HÀNH" title="Bài kiểm tra của bạn." description="Kiểm tra những gì bạn nhớ. Mỗi lần luyện tập là một bước tiến."/><div className="practice-wrap"><Card className="quiz-card">{error && <div className="form-error" role="alert">{error}</div>}{!quiz ? <><div className="quiz-icon"><Target size={28}/></div><h2>Bạn đã sẵn sàng kiểm tra từ vựng?</h2><p>Chọn nghĩa phù hợp với mỗi từ.</p><button className="button" onClick={start} disabled={loading}>{loading ? 'Đang chuẩn bị…' : 'Bắt đầu kiểm tra'} <ArrowRight size={16}/></button></> : result ? <><div className="quiz-icon"><Sparkles size={28}/></div><h2>Đã hoàn thành bài kiểm tra.</h2><p>Bạn trả lời đúng {result.score} / {result.question_count} câu.</p><button className="button" onClick={start}>Làm bài khác</button></> : <form onSubmit={submit}>{quiz.questions.map((q, i) => <fieldset className="question" key={q.id}><legend><span>{String(i + 1).padStart(2, '0')}</span> “{q.prompt}” nghĩa là gì?</legend>{q.options.map(option => <label className="option" key={option.key}><input type="radio" name={`q${q.id}`} value={option.key} checked={answers[q.id] === option.key} onChange={() => setAnswers({ ...answers, [q.id]: option.key })}/>{option.text}</label>)}</fieldset>)}<button className="button" type="submit">Kiểm tra đáp án <ArrowRight size={16}/></button></form>}</Card></div></>
}
export function History() {
  const api = useApi()
  const state = useLoad(() => Promise.all([api.reviews(), api.quizzes()]))
  return <><PageHeader eyebrow="HÀNH TRÌNH CỦA BẠN" title="Nhìn lại hành trình học tập." description="Theo dõi những gì bạn đã luyện tập."/><State {...state}><div className="history-grid"><Card><h2>Lần ôn tập gần đây</h2>{results(state.data?.[0]).length ? results(state.data[0]).map(r => <div className="history-row" key={r.id}><div><strong>{r.word || r.vocabulary_word || `Từ ${r.vocabulary}`}</strong><small>{new Date(r.reviewed_at).toLocaleDateString('vi-VN')}</small></div><span className="badge">{r.rating}</span></div>) : <p className="muted">Các từ đã ôn tập sẽ xuất hiện ở đây.</p>}</Card><Card><h2>Lịch sử kiểm tra</h2>{results(state.data?.[1]).length ? results(state.data[1]).map(q => <div className="history-row" key={q.id}><strong>Bài kiểm tra</strong><span>{q.score} / {q.question_count}</span></div>) : <p className="muted">Các bài kiểm tra đã hoàn thành sẽ xuất hiện ở đây.</p>}<Link className="text-link" href="/quiz">Làm bài kiểm tra <ArrowRight size={16}/></Link></Card></div></State></>
}
export function AdminDashboard() { const api = useApi(); const state = useLoad(() => api.adminDashboard()); return <><PageHeader eyebrow="QUẢN LÝ" title="Tổng quan quản trị." description="Tổng quan người học và nội dung."/><State {...state}><Stats items={[[ 'Học viên', count(state.data,'users','user_count'), <Target size={19}/>, 'mint', 'Tài khoản đã đăng ký'], ['Từ vựng', count(state.data,'vocabulary','vocabulary_count'), <BookOpen size={19}/>, 'peach', 'Số từ trong thư viện'], ['Chủ đề', count(state.data,'categories','category_count'), <Layers3 size={19}/>, 'blue', 'Nhóm chủ đề'], ['Lượt ôn tập', count(state.data,'reviews','review_count'), <Sparkles size={19}/>, 'yellow', 'Hoạt động học tập']]}/><div className="admin-actions"><ActionLink to="/admin/vocabulary">Quản lý từ vựng</ActionLink><ActionLink className="secondary" to="/admin/categories">Quản lý chủ đề</ActionLink></div></State></> }
const blankWord = { word: '', meaning_en: '', meaning_vi: '', phonetic: '', example_sentence: '', audio_url: '', level: '', category: '' }
function BulkWords({ onSaved }) {
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState([{ word: '', meaning_en: '', meaning_vi: '' }])
  const [mode, setMode] = useState('paste')
  const [bulkText, setBulkText] = useState('')
  const [level, setLevel] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const state = useLoad(() => Promise.all([api.levels(), api.categories()]))
  function update(index, field, value) {
    setRows(current => current.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }
  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      let entries = rows
      if (mode === 'paste') {
        const lines = bulkText.split(/\r?\n/).map((line, index) => ({ text: line.trim(), number: index + 1 })).filter(line => line.text)
        if (!lines.length) throw new Error('Hãy dán ít nhất một dòng từ vựng.')
        if (lines.length > 100) throw new Error('Mỗi lần chỉ được thêm tối đa 100 từ.')
        entries = lines.map(line => {
          const columns = line.text.split(line.text.includes('\t') ? '\t' : '|').map(value => value.trim())
          if (columns.length !== 3 || columns.some(value => !value)) throw new Error(`Dòng ${line.number} chưa đúng: cần từ, nghĩa tiếng Anh và nghĩa tiếng Việt, ngăn cách bằng dấu | hoặc tab.`)
          return { word: columns[0], meaning_en: columns[1], meaning_vi: columns[2] }
        })
      }
      setSaving(true)
      await api.saveWords(entries.map(row => ({
        ...Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value.trim()])),
        level: Number(level), category: Number(category),
      })))
      setNotice(`Đã thêm ${entries.length} từ.`)
      setRows([{ word: '', meaning_en: '', meaning_vi: '' }])
      setBulkText('')
      setOpen(false)
      onSaved()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <div className="admin-actions" style={{ display: 'block' }}>
    <button type="button" className="button secondary" onClick={() => { setOpen(!open); setError(''); setNotice('') }}>{open ? 'Đóng nhập nhiều từ' : 'Thêm nhiều từ'}</button>
    {notice && <p role="status">{notice}</p>}
    {open && <Card className="editor"><h2>Thêm nhiều từ cùng lúc</h2><p>Chọn cấp độ, chủ đề chung và dán tối đa 100 dòng. Mỗi dòng gồm: từ tiếng Anh | nghĩa tiếng Anh | nghĩa tiếng Việt. Bạn cũng có thể dán 3 cột từ Excel.</p>
      <State {...state}><form onSubmit={submit}>
        <div className="form-grid"><label className="field"><span>Cấp độ chung</span><select value={level} onChange={e => setLevel(e.target.value)} required><option value="">Chọn cấp độ</option>{results(state.data?.[0]).map(l => <option key={l.id} value={l.id}>{l.code}</option>)}</select></label>
        <label className="field"><span>Chủ đề chung</span><select value={category} onChange={e => setCategory(e.target.value)} required><option value="">Chọn chủ đề</option>{results(state.data?.[1]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
        <div className="admin-actions"><button type="button" className={`button ${mode === 'paste' ? '' : 'secondary'}`} aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>Dán danh sách</button><button type="button" className={`button ${mode === 'rows' ? '' : 'secondary'}`} aria-pressed={mode === 'rows'} onClick={() => setMode('rows')}>Nhập từng dòng</button></div>
        {mode === 'paste' ? <label className="field"><span>Danh sách từ vựng</span><textarea aria-label="Danh sách từ vựng" aria-describedby="bulk-help" rows={9} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'apple | a fruit | quả táo\nbook | something to read | quyển sách'} required/><small id="bulk-help">Mỗi dòng là một từ. Không dùng dấu | trong nội dung từng cột.</small></label> : rows.map((row, index) => <div className="editor" key={index}><h3>Từ {index + 1}</h3><div className="form-grid">{[['word', 'Từ'], ['meaning_en', 'Nghĩa tiếng Anh'], ['meaning_vi', 'Nghĩa tiếng Việt']].map(([field, label]) => <TextField key={field} label={`${label} ${index + 1}`} value={row[field]} onChange={e => update(index, field, e.target.value)} required/>)}</div>{rows.length > 1 && <button type="button" className="button secondary" onClick={() => setRows(current => current.filter((_, i) => i !== index))}>Xóa từ {index + 1}</button>}</div>)}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="admin-actions">{mode === 'rows' && <button type="button" className="button secondary" disabled={rows.length >= 100 || saving} onClick={() => setRows(current => [...current, { word: '', meaning_en: '', meaning_vi: '' }])}>Thêm dòng</button>}<button className="button" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu tất cả'}</button></div>
      </form></State></Card>}
  </div>
}
export function AdminWords() {
  const [version, setVersion] = useState(0)
  return <><BulkWords onSaved={() => setVersion(v => v + 1)}/><AdminWordsEditor key={version}/></>
}
function AdminWordsEditor() {
  const api = useApi()
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [editing, setEditing] = useState(null); const [error, setError] = useState('')
  const state = useLoad(() => Promise.all([api.vocabulary({ search, page }), api.categories(), api.levels()]), [search, page])
  const change = e => setEditing({ ...editing, [e.target.name]: e.target.value })
  async function save(e) { e.preventDefault(); try { const { id, ...data } = editing; await api.saveWord(id, { ...data, level: Number(data.level), category: Number(data.category) }); setEditing(null); setError(''); state.reload() } catch (err) { setError(err.message) } }
  async function remove(id) { if (!window.confirm('Xóa từ này? Không thể hoàn tác.')) return; try { await api.deleteWord(id); state.reload() } catch (err) { setError(err.message) } }
  return <><PageHeader eyebrow="QUẢN LÝ / TỪ VỰNG" title="Quản lý từ vựng." description="Quản lý và cập nhật thư viện từ vựng." action={<button className="button" onClick={() => setEditing({ ...blankWord })}><Plus size={17}/> Thêm từ</button>}/>{error && <div className="form-error" role="alert">{error}</div>}{editing && <Card className="editor"><h2>{editing.id ? 'Sửa từ' : 'Thêm từ'}</h2><form onSubmit={save}><div className="form-grid">{[['word','Từ'],['meaning_en','Nghĩa tiếng Anh'],['meaning_vi','Nghĩa tiếng Việt'],['phonetic','Phiên âm'],['example_sentence','Câu ví dụ'],['audio_url','Đường dẫn âm thanh']].map(([name,label]) => <TextField key={name} label={label} name={name} value={editing[name] || ''} onChange={change} required={['word','meaning_en','meaning_vi'].includes(name)} type={name === 'audio_url' ? 'url' : 'text'}/>)}<label className="field"><span>Cấp độ</span><select required name="level" value={editing.level} onChange={change}><option value="">Chọn cấp độ</option>{results(state.data?.[2]).map(l => <option key={l.id} value={l.id}>{l.code}</option>)}</select></label><label className="field"><span>Chủ đề</span><select required name="category" value={editing.category} onChange={change}><option value="">Chọn chủ đề</option>{results(state.data?.[1]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><div className="admin-actions"><button className="button">Lưu từ</button><button type="button" className="button secondary" onClick={() => setEditing(null)}>Hủy</button></div></form></Card>}<label className="search-box admin-search"><Search size={18}/><span className="sr-only">Tìm từ</span><input placeholder="Tìm từ..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/></label><State {...state} empty={!results(state.data?.[0]).length}><Card className="table-card"><div className="table-scroll"><table><thead><tr><th>Từ</th><th>Nghĩa</th><th>Cấp độ</th><th>Chủ đề</th><th>Thao tác</th></tr></thead><tbody>{results(state.data?.[0]).map(w => <tr key={w.id}><td><strong>{w.word}</strong></td><td>{w.meaning_vi}</td><td><span className={badgeClass(w.level)}>{w.level}</span></td><td>{results(state.data?.[1]).find(c => c.id === w.category)?.name || '—'}</td><td><button className="icon-button" aria-label={`Sửa ${w.word}`} onClick={() => setEditing({ ...w, level: results(state.data?.[2]).find(l => l.code === w.level)?.id || w.level })}><Pencil size={16}/></button><button className="icon-button" aria-label={`Xóa ${w.word}`} onClick={() => remove(w.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page}</span><button disabled={!state.data?.[0]?.next} onClick={() => setPage(page + 1)}>Tiếp</button></div></Card></State></>
}
export function AdminCategories() {
  const api = useApi()
  const state = useLoad(() => Promise.all([api.categories(), api.levels()])); const [name, setName] = useState(''); const [error, setError] = useState('')
  async function add(e) { e.preventDefault(); try { await api.saveCategory(null, { name, slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }); setName(''); state.reload() } catch (err) { setError(err.message) } }
  async function edit(item, type) { const value = window.prompt(`Sửa ${type === 'level' ? 'tên cấp độ' : 'tên chủ đề'}`, item.name); if (!value?.trim()) return; try { if (type === 'level') await api.saveLevel(item.id, { name: value.trim() }); else await api.saveCategory(item.id, { name: value.trim() }); state.reload() } catch (err) { setError(err.message) } }
  async function remove(item) { if (!window.confirm(`Xóa chủ đề “${item.name}”?`)) return; try { await api.deleteCategory(item.id); state.reload() } catch (err) { setError(err.message) } }
  return <><PageHeader eyebrow="QUẢN LÝ / CHỦ ĐỀ" title="Chủ đề và cấp độ." description="Sắp xếp từ vựng theo chủ đề và cấp độ."/>{error && <div className="form-error" role="alert">{error}</div>}<State {...state}><div className="history-grid"><Card><h2>Chủ đề</h2><form className="inline-form" onSubmit={add}><TextField label="Chủ đề mới" value={name} onChange={e => setName(e.target.value)} required/><button className="button">Thêm</button></form>{results(state.data?.[0]).map(c => <div className="history-row" key={c.id}><strong>{c.name}</strong><div><button className="icon-button" aria-label={`Sửa ${c.name}`} onClick={() => edit(c,'category')}><Pencil size={16}/></button><button className="icon-button" aria-label={`Xóa ${c.name}`} onClick={() => remove(c)}><Trash2 size={16}/></button></div></div>)}</Card><Card><h2>Cấp độ CEFR</h2><p className="muted">Mã cấp độ được giữ nguyên; bạn có thể sửa tên.</p>{results(state.data?.[1]).map(l => <div className="history-row" key={l.id}><div><span className={badgeClass(l.code)}>{l.code}</span> {l.name}</div><button className="icon-button" aria-label={`Sửa ${l.code}`} onClick={() => edit(l,'level')}><Pencil size={16}/></button></div>)}</Card></div></State></>
}
