import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AdminWords } from './pages'
import { fixtureApi } from './services/fixtures'
import { Refine } from '@refinedev/core'
import { dataProvider } from './services/refine'

vi.mock('./services/api', async () => {
  const { fixtureApi } = await import('./services/fixtures')
  return {
    api: fixtureApi,
    results: data => Array.isArray(data) ? data : data?.results || [],
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('fixture vocabulary editor', () => {
  it('adds multiple words with a shared level and category', async () => {
    const user = userEvent.setup()
    const save = vi.spyOn(fixtureApi, 'saveWords')
    render(<MemoryRouter><Refine dataProvider={dataProvider}><AdminWords /></Refine></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Thêm nhiều từ' }))
    await user.selectOptions(await screen.findByLabelText('Cấp độ chung'), '1')
    await user.selectOptions(screen.getByLabelText('Chủ đề chung'), '1')
    await user.click(screen.getByRole('button', { name: 'Nhập từng dòng' }))
    await user.type(screen.getByLabelText('Từ 1'), 'apple')
    await user.type(screen.getByLabelText('Nghĩa tiếng Anh 1'), 'fruit')
    await user.type(screen.getByLabelText('Nghĩa tiếng Việt 1'), 'tao')
    await user.click(screen.getByRole('button', { name: 'Thêm dòng' }))
    await user.type(screen.getByLabelText('Từ 2'), 'book')
    await user.type(screen.getByLabelText('Nghĩa tiếng Anh 2'), 'reading material')
    await user.type(screen.getByLabelText('Nghĩa tiếng Việt 2'), 'sach')
    await user.click(screen.getByRole('button', { name: 'Lưu tất cả' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith([
      { word: 'apple', meaning_en: 'fruit', meaning_vi: 'tao', level: 1, category: 1 },
      { word: 'book', meaning_en: 'reading material', meaning_vi: 'sach', level: 1, category: 1 },
    ]))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã thêm 2 từ')
  })

  it('pastes multiple words and rejects a malformed line without saving', async () => {
    const user = userEvent.setup()
    const save = vi.spyOn(fixtureApi, 'saveWords')
    render(<MemoryRouter><Refine dataProvider={dataProvider}><AdminWords /></Refine></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Thêm nhiều từ' }))
    await user.selectOptions(await screen.findByLabelText('Cấp độ chung'), '1')
    await user.selectOptions(screen.getByLabelText('Chủ đề chung'), '1')
    const input = screen.getByLabelText('Danh sách từ vựng')
    await user.type(input, 'apple | fruit | tao{enter}invalid')
    await user.click(screen.getByRole('button', { name: 'Lưu tất cả' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dòng 2')
    expect(save).not.toHaveBeenCalled()
    await user.clear(input)
    await user.type(input, 'apple | fruit | tao{enter}book | reading material | sach')
    await user.click(screen.getByRole('button', { name: 'Lưu tất cả' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith([
      { word: 'apple', meaning_en: 'fruit', meaning_vi: 'tao', level: 1, category: 1 },
      { word: 'book', meaning_en: 'reading material', meaning_vi: 'sach', level: 1, category: 1 },
    ]))
  })

  it('retains an existing word’s level when saving other changes', async () => {
    const user = userEvent.setup()
    const save = vi.spyOn(fixtureApi, 'saveWord')
    render(<MemoryRouter><Refine dataProvider={dataProvider}><AdminWords /></Refine></MemoryRouter>)

    await user.click(await screen.findByRole('button', { name: 'Sửa curious' }))
    expect(screen.getByLabelText('Cấp độ')).toHaveValue('2')
    const meaning = screen.getByLabelText('Nghĩa tiếng Anh')
    await user.clear(meaning)
    await user.type(meaning, 'Interested in learning')
    await user.click(screen.getByRole('button', { name: 'Lưu từ' }))

    await waitFor(() => expect(save).toHaveBeenCalledWith(2, expect.objectContaining({
      level: 2,
      meaning_en: 'Interested in learning',
    })))
    expect((await fixtureApi.vocabulary({ search: 'curious' })).results[0].level).toBe('A2')
  })
})
