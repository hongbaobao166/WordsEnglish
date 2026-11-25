// Synthetic, in-memory data for isolated development only. Reloading resets it.
let words = [
  { id: 1, word: 'serendipity', phonetic: '/ˌser.ənˈdɪp.ə.ti/', meaning_en: 'Finding something good without looking for it', meaning_vi: 'Sự tình cờ may mắn', example_sentence: 'Finding this little café was pure serendipity.', level: 'C1', category: 1 },
  { id: 2, word: 'curious', phonetic: '/ˈkjʊə.ri.əs/', meaning_en: 'Eager to know or learn something', meaning_vi: 'Tò mò, ham hiểu biết', example_sentence: 'She is curious about the world.', level: 'A2', category: 2 },
  { id: 3, word: 'wander', phonetic: '/ˈwɒn.dər/', meaning_en: 'To walk slowly without a fixed direction', meaning_vi: 'Đi lang thang', example_sentence: 'We wandered through the old streets.', level: 'B1', category: 3 },
  { id: 4, word: 'bright', phonetic: '/braɪt/', meaning_en: 'Full of light or intelligence', meaning_vi: 'Sáng, thông minh', example_sentence: 'It was a bright morning.', level: 'A1', category: 1 },
  { id: 5, word: 'thoughtful', phonetic: '/ˈθɔːt.fəl/', meaning_en: 'Kind and considerate of others', meaning_vi: 'Chu đáo', example_sentence: 'That was a thoughtful gift.', level: 'B2', category: 2 },
  { id: 6, word: 'eloquent', phonetic: '/ˈel.ə.kwənt/', meaning_en: 'Able to express ideas clearly and beautifully', meaning_vi: 'Hùng biện', example_sentence: 'She gave an eloquent speech.', level: 'C2', category: 2 },
]
let categories = [{ id: 1, name: 'Everyday life', slug: 'everyday-life' }, { id: 2, name: 'People & feelings', slug: 'people-feelings' }, { id: 3, name: 'Travel', slug: 'travel' }]
let levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((code, i) => ({ id: i + 1, code, name: ['Beginner', 'Elementary', 'Intermediate', 'Upper intermediate', 'Advanced', 'Proficient'][i] }))
let users = [{ id: 1, username: 'learner', email: 'learner@example.test', is_staff: false, is_active: true }, { id: 2, username: 'admin', email: 'admin@example.test', is_staff: true, is_active: true }]
let history = []
let quizHistory = []
let quiz
const list = items => ({ count: items.length, results: items })
const save = (items, id, data) => { if (id) { const item = items.find(x => x.id === id); Object.assign(item, data); return item } const item = { ...data, id: Math.max(0, ...items.map(item => item.id)) + 1 }; items.push(item); return item }
export const fixtureApi = {
  async login({ username }) { return users.find(u => u.username === username) || { id: 3, username, is_staff: false } },
  async register() { return {} }, async logout() {},
  async dashboard() { return { total: words.length, due: words.length, learning: history.length, mastered: 0, reviews: history.length } },
  async vocabulary({ search = '', level = '', category = '' } = {}) { return list(words.filter(w => `${w.word} ${w.meaning_en} ${w.meaning_vi}`.toLowerCase().includes(search.toLowerCase()) && (!level || w.level === level) && (!category || String(w.category) === String(category)))) },
  async categories() { return list(categories) }, async levels() { return list(levels) }, async due() { return list(words) },
  async review(id, rating) { history.unshift({ id: Date.now(), word: words.find(w => w.id === id)?.word, rating, reviewed_at: new Date().toISOString() }) },
  async createQuiz() { quiz = { id: 1, questions: words.slice(0, 5).map((w, i) => ({ id: i + 1, prompt: w.word, options: [{ key: 'A', text: w.meaning_en }, { key: 'B', text: words[(i + 1) % words.length].meaning_en }] })) }; return quiz },
  async submitQuiz(id, answers) { const result = { id: quizHistory.length + 1, score: answers.filter(a => a.selected_option === 'A').length, question_count: quiz.questions.length }; quizHistory.unshift(result); return result },
  async reviews() { return list(history) }, async quizzes() { return list(quizHistory) },
  async adminDashboard() { return { users: users.length, vocabulary: words.length, categories: categories.length, reviews: history.length } },
  async users() { return list(users) },
  async saveWord(id, data) { return save(words, id, { ...data, category: Number(data.category), level: levels.find(l => l.id === Number(data.level))?.code || data.level }) },
  async saveWords(items) { return Promise.all(items.map(item => this.saveWord(null, item))) },
  async deleteWord(id) { words = words.filter(w => w.id !== id) },
  async saveCategory(id, data) { return save(categories, id, data) }, async deleteCategory(id) { categories = categories.filter(c => c.id !== id) },
  async saveLevel(id, data) { return save(levels, id, data) }, async saveUser(id, data) { return save(users, id, data) },
}
