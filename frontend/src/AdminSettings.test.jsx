import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Refine } from '@refinedev/core'
import AdminSettings from './AdminSettings'
import { MemoryRouter } from 'react-router-dom'

it('creates a role with selected resource actions and assigns it to a user', async () => {
  const api = {
    roles: vi.fn().mockResolvedValue({ results: [{ id: 1, name: 'Biên tập', permissions: [1] }] }),
    permissions: vi.fn().mockResolvedValue([{ id: 1, codename: 'add_vocabulary', content_type__model: 'vocabulary' }]),
    users: vi.fn().mockResolvedValue({ results: [{ id: 3, username: 'learner', groups: [], is_superuser: false }] }),
    saveRole: vi.fn().mockResolvedValue({}), saveUser: vi.fn().mockResolvedValue({}),
  }
  const user = userEvent.setup()
  render(<MemoryRouter><Refine dataProvider={{ learning: api, getApiUrl: () => '/api', getList: async () => ({ data: [], total: 0 }) }}><AdminSettings/></Refine></MemoryRouter>)
  await user.type(await screen.findByLabelText('Tên vai trò'), 'Người nhập từ')
  await user.click(screen.getByLabelText('Thêm'))
  await user.click(screen.getByRole('button', { name: 'Lưu vai trò' }))
  await waitFor(() => expect(api.saveRole).toHaveBeenCalledWith(undefined, { name: 'Người nhập từ', permissions: [1] }))
  await user.click(await screen.findByLabelText('Biên tập'))
  await user.click(screen.getByRole('button', { name: 'Lưu vai trò cho learner' }))
  await waitFor(() => expect(api.saveUser).toHaveBeenCalledWith(3, { groups: [1] }))
})
