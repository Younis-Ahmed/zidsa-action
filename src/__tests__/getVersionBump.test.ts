import * as childProcess from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'
import { getVersionBump } from '../getVersionBump.js'

// Mock execSync to simulate Git commit messages
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

describe('getVersionBump', () => {
  it('should return major version bump when breaking changes are detected', async () => {
    vi.mocked(childProcess.execSync).mockReturnValue(
      'feat!: breaking change in API\nfeat: add new feature\nfix: bug fix',
    )

    const rec = await getVersionBump('.')
    expect(rec).toEqual({
      releaseType: 'major',
      reason: 'Breaking changes detected in recent commits',
    })
  })

  it('should return minor version bump when features are detected', async () => {
    vi.mocked(childProcess.execSync).mockReturnValue(
      'feat: add new feature\nfix: bug fix',
    )

    const rec = await getVersionBump('.')
    expect(rec).toEqual({
      releaseType: 'minor',
      reason: 'New features detected in recent commits',
    })
  })

  it('should return patch version bump for normal commits', async () => {
    vi.mocked(childProcess.execSync).mockReturnValue(
      'fix: bug fix\ndocs: update documentation',
    )

    const rec = await getVersionBump('.')
    expect(rec).toEqual({
      releaseType: 'patch',
      reason: 'Bug fixes and improvements detected in recent commits',
    })
  })

  it('should default to patch when no commits are found', async () => {
    vi.mocked(childProcess.execSync).mockReturnValue('')

    const rec = await getVersionBump('.')
    expect(rec).toEqual({
      releaseType: 'patch',
      reason: 'No recent commits found, defaulting to patch release',
    })
  })

  it('should default to patch when an error occurs', async () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw new Error('Git command failed')
    })

    const rec = await getVersionBump('.')
    expect(rec).toEqual({
      releaseType: 'patch',
      reason: 'Using default patch release due to error analyzing commits',
    })
  })
})
