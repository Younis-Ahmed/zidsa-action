import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Api from '../api.js'
import * as tokenModule from '../token.js'

vi.spyOn(tokenModule, 'getToken').mockReturnValue('fake-token')

describe('api', () => {
  let originalFetch: any
  beforeEach(() => {
    originalFetch = globalThis.fetch
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should construct correct URL and send request', async () => {
    const fakeResponse = {
      ok: true,
      json: async () => ({ data: 'success' }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(fakeResponse)
    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')
      .addUserToken()
      .addBody({ key: 'value' })
      .post()
    const result = await api.send()
    expect(result).toEqual({ data: 'success' })
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  it('should handle token expiration', async () => {
    const fakeResponse = {
      ok: false,
      status: 401,
      json: async () => ({}),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(fakeResponse)
    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')
      .addUserToken()
    await expect(api.send()).rejects.toThrow()
  })

  it('should handle API errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')
    await expect(api.send()).rejects.toThrow('Network error')
  })
})
