import { request, setTokens, getTokens } from './client'
import { fixtureApi } from './fixtures'

const realApi = {
  async login(credentials) { const tokens = await request('/auth/login/', { method: 'POST', body: credentials }); setTokens(tokens); try { return await request('/auth/me/') } catch (error) { setTokens(null); throw error } },
  register: data => request('/auth/register/', { method: 'POST', body: data }),
  async logout() { try { if (getTokens()?.refresh) await request('/auth/logout/', { method: 'POST', body: { refresh: getTokens().refresh } }) } finally { setTokens(null) } },
  dashboard: () => request('/dashboard/'),
  vocabulary: params => request(`/vocabulary/?${new URLSearchParams(params)}`),
  categories: () => request('/categories/'),
  levels: () => request('/levels/'),
  due: () => request('/flashcards/'),
  review: (id, rating) => request('/reviews/', { method: 'POST', body: { vocabulary: id, rating: { again: 1, hard: 2, good: 4, easy: 5 }[rating] } }),
  createQuiz: async () => adaptQuiz(await request('/quizzes/', { method: 'POST', body: { count: 5 } })),
  submitQuiz: async (id, answers) => adaptQuiz(await request(`/quizzes/${id}/submit/`, { method: 'POST', body: { answers: Object.fromEntries(answers.map(a => [a.question_id, a.selected_option])) } })),
  reviews: () => request('/reviews/'),
  quizzes: async () => { const data = await request('/quizzes/'); return { ...data, results: data.results.filter(q => q.completed_at).map(adaptQuiz) } },
  adminDashboard: () => request('/admin/dashboard/'),
  users: (page = 1) => request(`/admin/users/?page=${page}`),
  roles: async () => {
    let page = 1, next = true
    const all = []
    while (next) {
      const response = await request(`/admin/roles/?page=${page++}`)
      all.push(...results(response))
      next = Boolean(response.next)
    }
    return { results: all, count: all.length }
  },
  permissions: () => request('/admin/permissions/'),
  saveRole: (id, data) => request(`/admin/roles/${id ? `${id}/` : ''}`, { method: id ? 'PATCH' : 'POST', body: data }),
  deleteRole: id => request(`/admin/roles/${id}/`, { method: 'DELETE' }),
  saveWord: (id, data) => request(`/vocabulary/${id ? `${id}/` : ''}`, { method: id ? 'PATCH' : 'POST', body: data }),
  saveWords: words => request('/vocabulary/bulk/', { method: 'POST', body: words }),
  deleteWord: id => request(`/vocabulary/${id}/`, { method: 'DELETE' }),
  saveCategory: (id, data) => request(`/categories/${id ? `${id}/` : ''}`, { method: id ? 'PATCH' : 'POST', body: data }),
  deleteCategory: id => request(`/categories/${id}/`, { method: 'DELETE' }),
  saveLevel: (id, data) => request(`/levels/${id}/`, { method: 'PATCH', body: data }),
  saveUser: (id, data) => request(`/admin/users/${id}/`, { method: 'PATCH', body: data }),
}
function adaptQuiz(quiz) {
  return { ...quiz, question_count: quiz.questions.length, questions: quiz.questions.map(q => ({
    ...q, prompt: q.word, options: q.options.map(text => ({ key: text, text })),
  })) }
}
// Fixtures are opt-in and must be removed during backend integration.
export const fixtureMode = process.env.NEXT_PUBLIC_USE_FIXTURES === 'true'
export const api = fixtureMode ? fixtureApi : realApi
export const results = data => Array.isArray(data) ? data : data?.results || []
