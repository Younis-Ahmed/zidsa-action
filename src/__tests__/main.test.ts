import * as core from '@actions/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '../login.js'
import { run } from '../main.js'
import updateTheme from '../update.js'
import * as utils from '../utils.js'

// Mock dependencies
vi.mock('@actions/core')
vi.mock('../login.js')
vi.mock('../update.js')
vi.mock('../utils.js')

describe('main', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Set up default mock implementations
    vi.mocked(utils.getVariables).mockReturnValue({
      EMAIL: 'test@example.com',
      PASSWORD: 'password123',
      THEME_ID: '123',
    })
    vi.mocked(utils.getWorkspacePath).mockReturnValue('/workspace')
    vi.mocked(login).mockResolvedValue()
    vi.mocked(updateTheme).mockResolvedValue({})
    vi.spyOn(core, 'setFailed').mockImplementation(() => {})
    vi.spyOn(core, 'info').mockImplementation(() => {})
    vi.spyOn(core, 'setOutput').mockImplementation(() => {})
  })

  it('should successfully run the action', async () => {
    await run()

    // Verify all dependencies were called correctly
    expect(utils.getVariables).toHaveBeenCalledWith(['EMAIL', 'PASSWORD', 'THEME_ID'])
    expect(utils.getWorkspacePath).toHaveBeenCalled()
    expect(login).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(updateTheme).toHaveBeenCalledWith('123', '/workspace')
    expect(core.info).toHaveBeenCalledWith('Theme updated successfully')
    expect(core.setOutput).toHaveBeenCalledWith('success', 'true')
  })

  it('should handle errors gracefully', async () => {
    const testError = new Error('Test error')
    vi.mocked(login).mockRejectedValueOnce(testError)

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Test error')
    expect(core.setOutput).not.toHaveBeenCalled()
  })

  it('should handle non-Error exceptions', async () => {
    const stringError = 'String error'
    vi.mocked(login).mockRejectedValueOnce(stringError)

    await run()

    // When a non-Error is thrown, it should still call setFailed but without a message
    expect(core.setFailed).toHaveBeenCalled()
  })
})
