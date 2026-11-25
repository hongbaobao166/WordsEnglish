const base = process.env.NEXT_PUBLIC_API_URL || '/api'
const messages = {
  'No active account found with the given credentials': 'Tên đăng nhập hoặc mật khẩu không đúng.',
  'Not enough vocabulary with distinct Vietnamese meanings.': 'Cần ít nhất 5 từ, với ít nhất 4 nghĩa tiếng Việt khác nhau, để tạo bài kiểm tra.',
  'This record is referenced and cannot be deleted.': 'Không thể xóa vì dữ liệu này đang được sử dụng.',
  'Only superusers can change account access.': 'Chỉ quản trị viên cao nhất được thay đổi quyền tài khoản.',
  'Cannot change superuser or your own access.': 'Không thể thay đổi quyền của quản trị viên cao nhất hoặc chính bạn.',
  'Quiz has already been submitted.': 'Bài kiểm tra này đã được nộp.',
  'Provide exactly one answer for every question.': 'Hãy chọn một đáp án cho mỗi câu hỏi.',
  "Each answer must be one of the question's options.": 'Mỗi đáp án phải nằm trong các lựa chọn.',
  'Invalid or expired refresh token.': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
}
const fields = { username: 'Tên đăng nhập', password: 'Mật khẩu', email: 'Email', word: 'Từ', meaning_en: 'Nghĩa tiếng Anh', meaning_vi: 'Nghĩa tiếng Việt', level: 'Cấp độ', category: 'Chủ đề', non_field_errors: 'Lỗi' }
const translate = value => messages[String(value)] || String(value)
const formatErrors = errors => Object.entries(errors).map(([key, value]) => `${fields[key] || key}: ${Array.isArray(value) ? value.map(translate).join(', ') : translate(value)}`).join('; ')
let tokens = null
export function setTokens(value) { tokens = value }
export function getTokens() { return tokens }
export async function request(path, options = {}, retry = true) {
  let response
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'vi', ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
  }
  if (response.status === 401 && retry && tokens?.refresh) {
    const refreshed = await request('/auth/refresh/', { method: 'POST', body: { refresh: tokens.refresh } }, false)
    tokens = { ...tokens, ...refreshed }
    const retryOptions = path === '/auth/logout/' ? { ...options, body: { refresh: tokens.refresh } } : options
    return request(path, retryOptions, false)
  }
  if (!response.ok) {
    let data = {}
    try { data = await response.json() } catch { /* Response may not be JSON. */ }
    const detail = Array.isArray(data)
      ? data.map((errors, index) => typeof errors === 'object' && Object.keys(errors).length ? `Từ ${index + 1}: ${formatErrors(errors)}` : typeof errors === 'string' ? translate(errors) : '').filter(Boolean).join('; ')
      : data.detail ? translate(data.detail) : formatErrors(data)
    throw new Error(detail || `Yêu cầu thất bại (${response.status})`)
  }
  return response.status === 204 ? null : response.json()
}
