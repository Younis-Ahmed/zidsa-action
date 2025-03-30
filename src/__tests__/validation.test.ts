import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import sdk from '../sdk.js'
import { formatSizeUnits, validateTheme } from '../validation.js'

// Stub sdk for testing validation
sdk.structure = { 
  root: ['index.html'],
  templates: [],
  common: [],
  modules: [],
  assets: [],
  locals: []
}
sdk.optional_files = { 
  root: [],
  templates: [],
  common: [],
  modules: [],
  assets: [],
  locals: []
}
sdk.need_structure_validation = []

// Mock fs functions
vi.spyOn(fs, 'readdirSync').mockImplementation((_path) => ['index.html'] as any)
vi.spyOn(fs, 'lstatSync').mockImplementation((_path) => ({
  isDirectory: () => false,
  size: 1024,
} as any))
vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

describe('validateTheme', () => {
  it('should validate correct theme structure', async () => {
    const result = await validateTheme('.')
    expect(result).toBe('Theme validated')
  })

  it('should reject when required files are missing', async () => {
    vi.spyOn(fs, 'readdirSync').mockReturnValueOnce(['wrong.html'] as any)
    await expect(validateTheme('.')).rejects.toThrow('Unable to find:')
  })
})

describe('formatSizeUnits', () => {
  it('should format sizes correctly', () => {
    expect(formatSizeUnits(2_000_000_000)).toContain('GB')
    expect(formatSizeUnits(2_000_000)).toContain('MB')
    expect(formatSizeUnits(2000)).toContain('KB')
    expect(formatSizeUnits(500)).toContain('bytes')
  })
})
