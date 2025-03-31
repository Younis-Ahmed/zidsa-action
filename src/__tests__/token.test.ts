import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'
import { configPath, getToken, setToken } from '../token.js'

// Mock dependencies
vi.mock('node:fs')
vi.mock('../logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))

describe('token', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getToken', () => {
    it('should return token when config file exists with valid content', () => {
      // Setup
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
        access_token: 'valid-token',
      }))

      // Act
      const result = getToken()

      // Assert
      expect(result).toBe('valid-token')
      expect(fs.existsSync).toHaveBeenCalledWith(configPath)
      expect(fs.readFileSync).toHaveBeenCalledWith(configPath, 'utf8')
    })

    it('should return null when config file exists but has no token', () => {
      // Setup
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({}))

      // Act
      const result = getToken()

      // Assert
      expect(result).toBeNull()
      expect(logger.log).toHaveBeenCalledWith('No session found. Attempting login first.')
    })

    it('should return null when config file does not exist', () => {
      // Setup
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)

      // Act
      const result = getToken()

      // Assert
      expect(result).toBeNull()
      expect(logger.log).toHaveBeenCalledWith('No session found. Attempting login first.')
    })
  })

  describe('setToken', () => {
    it('should save token successfully when directory exists', () => {
      // Setup
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)

      // Act
      const result = setToken('new-token')

      // Assert
      expect(result).toBe(true)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        configPath,
        JSON.stringify({ access_token: 'new-token' }),
      )
      expect(fs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should create directory and save token when directory does not exist', () => {
      // Setup
      const configDir = path.dirname(configPath)
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)

      // Act
      const result = setToken('new-token')

      // Assert
      expect(result).toBe(true)
      expect(fs.mkdirSync).toHaveBeenCalledWith(configDir, { recursive: true })
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        configPath,
        JSON.stringify({ access_token: 'new-token' }),
      )
    })

    it('should return false when saving token fails', () => {
      // Setup
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      const mockError = new Error('Write error')
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw mockError
      })

      // Act
      const result = setToken('new-token')

      // Assert
      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(`Failed to save token: ${mockError}`)
    })
  })
})
