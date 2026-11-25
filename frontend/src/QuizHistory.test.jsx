import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom'
import { Quiz, History } from './pages'
import { Refine } from '@refinedev/core'
import { dataProvider } from './services/refine'

vi.mock('./services/api', async () => {
  const { fixtureApi } = await import('./services/fixtures')
  return { api: fixtureApi, results: data => Array.isArray(data) ? data : data?.results || [] }
})

it('shows completed fixture quizzes in learning history', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/quiz']}>
    <Link to="/history">History</Link>
    <Refine dataProvider={dataProvider}><Routes><Route path="/quiz" element={<Quiz/>}/><Route path="/history" element={<History/>}/></Routes></Refine>
  </MemoryRouter>)

  await user.click(screen.getByRole('button', { name: /bắt đầu kiểm tra/i }))
  const questions = await screen.findAllByRole('group')
  for (const question of questions) {
    await user.click(within(question).getAllByRole('radio')[0])
  }
  await user.click(screen.getByRole('button', { name: /kiểm tra đáp án/i }))
  expect(await screen.findByText('Bạn trả lời đúng 5 / 5 câu.')).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'History' }))
  expect(await screen.findByText('5 / 5')).toBeInTheDocument()
  expect(screen.queryByText('Các bài kiểm tra đã hoàn thành sẽ xuất hiện ở đây.')).not.toBeInTheDocument()
})
