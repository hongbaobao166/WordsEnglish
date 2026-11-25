import { api, results } from './api'
import { request } from './client'

let identity = null
export const authProvider = {
  login: async credentials => {
    try { identity = await api.login(credentials); return { success: true } }
    catch (error) { return { success: false, error } }
  },
  register: async credentials => {
    try { await api.register(credentials); return { success: true } }
    catch (error) { return { success: false, error } }
  },
  logout: async () => {
    try { await api.logout(); return { success: true } }
    catch (error) { return { success: false, error } }
    finally { identity = null }
  },
  check: async () => ({ authenticated: !!identity }),
  getIdentity: async () => identity,
  onError: async error => ({ error }),
}

// Refine speaks to the same authenticated Django API as the learning screens.
export const dataProvider = {
  learning: api,
  getApiUrl: () => '/api',
  getList: async ({ resource, pagination, filters }) => {
    const params = { page: pagination?.currentPage || 1 }
    for (const filter of filters || []) if ('field' in filter && filter.value) params[filter.field] = filter.value
    const response = resource === 'vocabulary' ? await api.vocabulary(params) : await request(`/${resource}/?${new URLSearchParams(params)}`)
    return { data: results(response), total: response.count ?? results(response).length }
  },
  getOne: async ({ resource, id }) => ({ data: await request(`/${resource}/${id}/`) }),
  create: async ({ resource, variables }) => ({ data: await request(`/${resource}/`, { method: 'POST', body: variables }) }),
  update: async ({ resource, id, variables }) => ({ data: await request(`/${resource}/${id}/`, { method: 'PATCH', body: variables }) }),
  deleteOne: async ({ resource, id }) => { await request(`/${resource}/${id}/`, { method: 'DELETE' }); return { data: { id } } },
}
