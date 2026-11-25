import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Refine } from '@refinedev/core'
import { MemoryRouter } from 'react-router-dom'
import AdminUsers from './AdminUsers'

it('assigns an existing role from the user management screen', async () => {
  const api = {
    users: vi.fn().mockResolvedValue({ results: [{ id: 3, username: 'learner', groups: [], is_superuser: false, is_active: true }] }),
    roles: vi.fn().mockResolvedValue({ results: [{ id: 7, name: 'Người nhập từ' }] }),
    saveUser: vi.fn().mockResolvedValue({}),
  }
  const user = userEvent.setup()
  render(<MemoryRouter><Refine dataProvider={{ learning: api, getApiUrl: () => '/api', getList: async () => ({ data: [], total: 0 }) }}><AdminUsers/></Refine></MemoryRouter>)
  await user.click(await screen.findByRole('button', { name: 'Gán vai trò' }))
  await user.click(screen.getByLabelText('Người nhập từ'))
  await user.click(screen.getByRole('button', { name: 'Lưu vai trò' }))
  await waitFor(() => expect(api.saveUser).toHaveBeenCalledWith(3, { groups: [7] }))
})
