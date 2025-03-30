import process from 'node:process'
import { describe, expect, it, vi } from 'vitest'
import { getVariables, getWorkspacePath } from '../utils.js'

// Mock @actions/core getInput function
vi.mock('@actions/core', () => ({
  getInput: (key: string) => {
    const inputs: Record<string, string> = {
      EMAIL: 'test@example.com',
      PASSWORD: 'secret',
      THEME_ID: '123',
    }
    return inputs[key] || ''
  },
}))

describe('getVariables', () => {
  it('should return correct variables', () => {
    const vars = getVariables(['EMAIL', 'THEME_ID'])
    expect(vars).toEqual({ EMAIL: 'test@example.com', THEME_ID: '123' })
  })
})

describe('getWorkspacePath', () => {
  it('should return GITHUB_WORKSPACE if set', () => {
    process.env.GITHUB_WORKSPACE = '/workspace'
    expect(getWorkspacePath()).toBe('/workspace')
  })

  it('should return default if GITHUB_WORKSPACE is not set', () => {
    delete process.env.GITHUB_WORKSPACE
    expect(getWorkspacePath()).toBe('.')
  })
})
