import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import * as getVersionBump from '../getVersionBump.js'
import sdk from '../sdk.js' // assumed to exist
import * as validation from '../validation.js'
import zip_theme from '../zip-theme.js'

// Mock dependencies
vi.spyOn(validation, 'validateTheme').mockImplementation(() => Promise.resolve('Valid theme'))
vi.spyOn(getVersionBump, 'getVersionBump').mockImplementation(() =>
  Promise.resolve({ releaseType: 'patch', reason: 'Minor changes' }),
)

// Fake archiver instance
const fakeArchive = {
  pipe: vi.fn(),
  append: vi.fn(),
  pointer: vi.fn(() => 1024),
  finalize: vi.fn(() => Promise.resolve()),
}
vi.mock('archiver', () => ({
  default: () => fakeArchive,
}))

// Mock fs.createWriteStream to simulate 'finish' event
vi.spyOn(fs, 'createWriteStream').mockImplementation((_path) => {
  return {
    on: (event: string, cb: () => void) => {
      if (event === 'finish')
        cb()
    },
  } as any
})

// Stub sdk values
sdk.MAX_ZIP_FILE_SIZE_50MB = 50 * 1024 * 1024
sdk.root_allowed_files = ['index.js']
sdk.structure = { 
  root: ['assets'], 
  assets: [],
  templates: [],
  common: [],
  modules: [],
  locals: []
}

describe('zip_theme', () => {
  it('should create zip and return version bump recommendation', async () => {
    const build_name = 'theme'
    const build_path = path.resolve('.')
    const result = await zip_theme(build_name, build_path)
    expect(result).toEqual({ releaseType: 'patch', reason: 'Minor changes' })
    expect(fakeArchive.finalize).toHaveBeenCalled()
  })
})
