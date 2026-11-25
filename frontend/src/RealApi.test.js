import { afterEach, expect, test, vi } from 'vitest'
import { api } from './services/api'
import { request, setTokens } from './services/client'

afterEach(() => vi.unstubAllGlobals())

test('logout uses the rotated refresh token after access token expiry', async () => {
  setTokens({ access: 'old-access', refresh: 'old-refresh' })
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'new-access', refresh: 'new-refresh' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  await api.logout()
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ refresh: 'new-refresh' })
})

test('shows Vietnamese messages for connection and login errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'No active account found with the given credentials' }), { status: 401 })))
  await expect(request('/auth/login/')).rejects.toThrow('Không thể kết nối đến máy chủ')
  await expect(request('/auth/login/')).rejects.toThrow('Tên đăng nhập hoặc mật khẩu không đúng')
})

test('real API adapts login, review and quiz contracts', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'access', refresh: 'refresh' }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, username: 'learner' }), { status: 200 }))
    .mockResolvedValueOnce(new Response('{}', { status: 201 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, questions: [{ id: 3, word: 'hello', options: ['xin chao'] }] }), { status: 201 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, score: 1, questions: [{ id: 3, word: 'hello', options: ['xin chao'] }] }), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  await api.login({ username: 'learner', password: 'password' })
  await api.review(7, 'good')
  expect(fetchMock.mock.calls[2][0]).toBe('/api/reviews/')
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ vocabulary: 7, rating: 4 })
  const quiz = await api.createQuiz()
  expect(quiz.questions[0]).toMatchObject({ prompt: 'hello', options: [{ key: 'xin chao', text: 'xin chao' }] })
  await api.submitQuiz(2, [{ question_id: 3, selected_option: 'xin chao' }])
  expect(JSON.parse(fetchMock.mock.calls[4][1].body)).toEqual({ answers: { 3: 'xin chao' } })
  await api.logout()
})
