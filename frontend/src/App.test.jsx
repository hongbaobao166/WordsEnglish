import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { api } from './services/api'

vi.mock('./services/api', () => ({
  fixtureMode: true,
  results: data => Array.isArray(data) ? data : data?.results || [],
  api: {
    login: vi.fn(), register: vi.fn(), logout: vi.fn(), dashboard: vi.fn(), vocabulary: vi.fn(),
    categories: vi.fn(), levels: vi.fn(), due: vi.fn(), review: vi.fn(), createQuiz: vi.fn(),
    submitQuiz: vi.fn(), reviews: vi.fn(), quizzes: vi.fn(), adminDashboard: vi.fn(), users: vi.fn(),
  },
}))
const word = { id: 1, word: 'curious', meaning_en: 'Eager to learn', meaning_vi: 'Tò mò', level: 'A2', category: 1 }
beforeEach(() => {
  cleanup(); vi.resetAllMocks()
  api.login.mockResolvedValue({ username: 'learner', is_staff: false })
  api.dashboard.mockResolvedValue({ total: 1, due: 1, learning: 0, mastered: 0 })
  api.vocabulary.mockResolvedValue({ count: 1, results: [word] })
  api.categories.mockResolvedValue({ results: [{ id: 1, name: 'People' }] })
  api.due.mockResolvedValue({ results: [word] })
  api.review.mockResolvedValue({})
})
function renderApp(path = '/login') { return render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>) }
async function login(user) { await user.type(screen.getByLabelText('Tên đăng nhập'), 'learner'); await user.type(screen.getByLabelText('Mật khẩu'), 'password123'); await user.click(screen.getByRole('button', { name: /Đăng nhập/ })); await screen.findByText('Xin chào, learner.') }
describe('frontend flows', () => {
  it('validates registration passwords', async () => {
    const user = userEvent.setup(); renderApp('/register')
    await user.type(screen.getByLabelText('Tên đăng nhập'), 'someone')
    await user.type(screen.getByLabelText('Email'), 'a@example.test')
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'password123')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'different')
    await user.click(screen.getByRole('button', { name: /Tạo tài khoản/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu xác nhận không khớp')
    expect(api.register).not.toHaveBeenCalled()
  })
  it('signs in, searches vocabulary and reviews a flashcard', async () => {
    const user = userEvent.setup(); renderApp(); await login(user)
    await user.click(screen.getByRole('link', { name: 'Từ vựng' }))
    await screen.findByText('curious')
    await user.type(screen.getByLabelText('Tìm từ'), 'curious')
    await waitFor(() => expect(api.vocabulary).toHaveBeenCalledWith(expect.objectContaining({ search: 'curious' })))
    await user.click(screen.getByRole('link', { name: 'Thẻ ghi nhớ' }))
    const card = await screen.findByRole('button', { name: /từ này nghĩa là gì/i })
    expect(card).toHaveAttribute('aria-pressed', 'false')
    await user.click(card)
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(card).toHaveClass('is-flipped')
    await user.click(screen.getByRole('button', { name: 'Tốt' }))
    expect(api.review).toHaveBeenCalledWith(1, 'good')
    expect(await screen.findByText(/đã ôn tập xong/i)).toBeInTheDocument()
  })
  it('shows API errors instead of silently using fixtures', async () => {
    api.login.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup(); renderApp()
    await user.type(screen.getByLabelText('Tên đăng nhập'), 'learner')
    await user.type(screen.getByLabelText('Mật khẩu'), 'password123')
    await user.click(screen.getByRole('button', { name: /Đăng nhập/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
  })
  it('rejects a learner on the admin login page', async () => {
    const user = userEvent.setup(); renderApp('/login-ad')
    await user.type(screen.getByLabelText('Tên đăng nhập'), 'learner')
    await user.type(screen.getByLabelText('Mật khẩu'), 'password123')
    await user.click(screen.getByRole('button', { name: /Đăng nhập/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền quản trị')
    expect(api.logout).toHaveBeenCalled()
  })
  it('shows staff navigation and admin dashboard', async () => {
    api.login.mockResolvedValue({ username: 'learner', is_staff: true })
    api.adminDashboard.mockResolvedValue({ users: 2, vocabulary: 1, categories: 1, reviews: 0 })
    const user = userEvent.setup(); renderApp('/login-ad'); await login(user)
    await user.click(screen.getByRole('link', { name: 'Tổng quan quản trị' }))
    expect(await screen.findByText('Tổng quan quản trị.')).toBeInTheDocument()
    expect(await screen.findByText('Tài khoản đã đăng ký')).toBeInTheDocument()
  })
  it('requires answers before submitting a quiz', async () => {
    api.createQuiz.mockResolvedValue({ id: 1, questions: [{ id: 1, prompt: 'curious', options: [{ key: 'A', text: 'Eager to learn' }] }] })
    api.submitQuiz.mockResolvedValue({ score: 1, question_count: 1 })
    const user = userEvent.setup(); renderApp(); await login(user)
    await user.click(screen.getByRole('link', { name: 'Bài kiểm tra' }))
    await user.click(screen.getByRole('button', { name: /bắt đầu kiểm tra/i }))
    await user.click(await screen.findByRole('button', { name: /kiểm tra đáp án/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Hãy chọn đáp án')
    await user.click(screen.getByLabelText('Eager to learn'))
    await user.click(screen.getByRole('button', { name: /kiểm tra đáp án/i }))
    expect(await screen.findByText('Bạn trả lời đúng 1 / 1 câu.')).toBeInTheDocument()
  })
})

