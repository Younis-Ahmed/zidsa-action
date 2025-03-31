import { beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'
import { login } from '../login.js'
import * as tokenModule from '../token.js'

// Setup mock API functionality
const mockSend = vi.fn()

// Clear mocks before setting them up
vi.mock('../api.js', () => {
  return {
    default: class MockApi {
      reset() { return this }
      addBaseUrl() { return this }
      addParams() { return this }
      addFormData() { return this }
      addKey() { return this }
      addHeaders() { return this }
      addUserToken() { return this }
      addRoute() { return this }
      addBody() { return this }
      post() { return this }
      get() { return this }
      put() { return this }
      delete() { return this }
      send = mockSend
    },
  }
})

vi.mock('../token.js', () => ({
  getToken: vi.fn().mockReturnValue('mock-token'),
  setToken: vi.fn().mockReturnValue(true),
}))

vi.mock('../logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
  },
}))

describe('login()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockReset()
    vi.mocked(tokenModule.setToken).mockReturnValue(true)
  })

  it('should successfully login and set token', async () => {
    // Arrange
    mockSend.mockResolvedValueOnce({
      partner: { 'x-partner-token': 'fake-token' },
    })

    // Act
    await login('test@example.com', 'password')

    // Assert
    expect(tokenModule.setToken).toHaveBeenCalledWith('fake-token')
    expect(logger.log).toHaveBeenCalledWith('Authentication successful!')
  })

  it('should throw error when response has no partner object', async () => {
    // Arrange
    mockSend.mockResolvedValueOnce({})

    // Act & Assert
    await expect(login('test@example.com', 'password'))
      .rejects
      .toThrow('Invalid response from server')

    expect(logger.error).toHaveBeenCalledWith('Authentication failed. Invalid response from server.')
  })

  it('should throw error when partner object lacks token', async () => {
    // Arrange
    mockSend.mockResolvedValueOnce({ partner: {} })

    // Act & Assert
    await expect(login('test@example.com', 'password'))
      .rejects
      .toThrow('Invalid response from server')

    expect(logger.error).toHaveBeenCalledWith('Authentication failed. Invalid response from server.')
  })

  it('should throw error when saving token fails', async () => {
    // Arrange
    mockSend.mockResolvedValueOnce({
      partner: { 'x-partner-token': 'fake-token' },
    })
    vi.mocked(tokenModule.setToken).mockReturnValueOnce(false)

    // Act & Assert
    await expect(login('test@example.com', 'password'))
      .rejects
      .toThrow('Failed to save token')

    expect(logger.error).toHaveBeenCalledWith('Failed to save token.')
  })

  it('should propagate error when API request fails', async () => {
    // Arrange
    const error = new Error('Network error')
    mockSend.mockRejectedValueOnce(error)

    // Act & Assert
    await expect(login('test@example.com', 'password'))
      .rejects
      .toThrow('Network error')

    expect(logger.error).toHaveBeenCalledWith('Authentication failed')
  })
})
