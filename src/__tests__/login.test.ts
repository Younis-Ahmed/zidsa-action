import { describe, expect, it, vi } from 'vitest'
import Api from '../api.js'
import { login } from '../login.js'
import * as tokenModule from '../token.js'

// Mock token setter
vi.spyOn(tokenModule, 'setToken').mockImplementation(() => true)

// Fake Api chain response
const fakeSend = vi.fn().mockResolvedValue({
  partner: { 'x-partner-token': 'fake-token' },
})
vi.spyOn(Api.prototype, 'reset').mockReturnThis()
vi.spyOn(Api.prototype, 'addBaseUrl').mockReturnThis()
vi.spyOn(Api.prototype, 'addRoute').mockReturnThis()
vi.spyOn(Api.prototype, 'addHeaders').mockReturnThis()
vi.spyOn(Api.prototype, 'addBody').mockReturnThis()
vi.spyOn(Api.prototype, 'post').mockReturnThis()
vi.spyOn(Api.prototype, 'send').mockImplementation(fakeSend)

describe('login', () => {
  it('should login successfully with valid credentials', async () => {
    await expect(login('test@example.com', 'password')).resolves.toBeUndefined()
  })

  it('should fail to login with invalid response', async () => {
    vi.spyOn(Api.prototype, 'send').mockResolvedValueOnce({})
    await expect(login('test@example.com', 'password')).rejects.toThrow('Invalid response from server')
  })
})
