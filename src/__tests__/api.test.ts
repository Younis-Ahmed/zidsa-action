import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Api from '../api.js'
import logger from '../logger.js'

// Mock dependencies
vi.mock('../logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock('../token.js', () => ({
  getToken: vi.fn().mockReturnValue('fake-token'),
}))

describe('api', () => {
  let originalFetch: any

  beforeEach(() => {
    originalFetch = globalThis.fetch
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('builder methods', () => {
    it('should build a complete API request with all methods', async () => {
      const jsonResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'success' }),
      }
      globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse)
      const api = new Api()
        .reset()
        .addBaseUrl('https://api.example.com')
        .addParams([{ key: 'page', value: '1' }, { key: 'limit', value: '10' }])
        .addHeaders([{ key: 'x-partner-token', value: 'fake-token' }])
        .addRoute('/users')
        .addBody({ name: 'John' })
        .post()

      // Send the request
      await api.send()
      // Verify the fetch call
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-partner-token': 'fake-token',
          }),
          body: JSON.stringify({ name: 'John' }),
        }),
      )
    })

    it('should handle array values in params', () => {
      const api = new Api().addParams([
        { key: 'ids', value: ['1', '2', '3'] },
      ])

      expect((api as any).params).toBe('?ids=1,2,3')
    })

    it('should use default base URL when none provided', () => {
      const api = new Api().addBaseUrl()
      expect((api as any).baseUrl).toBe('https://api.zid.sa/v1')
    })

    it('should handle FormData bodies', () => {
      import('form-data').then((FormDataModule) => {
        const FormData = FormDataModule.default || FormDataModule
        const formData = new FormData()
        formData.append('file', 'test-data')

        const api = new Api().addFormData(formData)
        expect((api as any).body).toBe(formData)
        expect((api as any).headers['Content-Type']).toBe('multipart/form-data')
      })
    })
  })

  it('should set correct HTTP methods', () => {
    const api = new Api()

    api.get()
    expect((api as any).method).toBe('GET')

    api.post()
    expect((api as any).method).toBe('POST')

    api.put()
    expect((api as any).method).toBe('PUT')

    api.delete()
    expect((api as any).method).toBe('DELETE')
  })
})

describe('http requests', () => {
  it('should successfully send a request and parse JSON response', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ data: 'success' }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')
      .get()

    const result = await api.send()

    expect(result).toEqual({ data: 'success' })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Object),
        body: undefined, // GET requests don't have a body
      }),
    )
  })

  it('should include body in non-GET requests', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')
      .addBody({ name: 'test' })
      .post()

    await api.send()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'test' }),
      }),
    )
  })

  it('should handle 401 unauthorized responses', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({}),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow('Token expired, please login again')
    expect(logger.error).toHaveBeenCalledWith('Token expired, please login again')
  })

  it('should handle server errors with structured error message', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'Internal server error' }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow('Internal server error')
  })

  it('should handle server errors with fallback error message', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({}), // No message in response
    }
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow('Request failed with status 404')
  })

  it('should handle network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow('Network error')
    expect(logger.error).toHaveBeenCalledWith('API request failed: Network error')
  })

  it('should handle non-Error exceptions', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('String error')

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow('String error')
    expect(logger.error).toHaveBeenCalledWith('API request failed: "String error"')
  })

  it('should handle JSON stringify failures', async () => {
    // Create circular reference object that can't be JSON stringified
    const circularObj: any = {}
    circularObj.self = circularObj

    globalThis.fetch = vi.fn().mockRejectedValue(circularObj)

    const api = new Api()
      .reset()
      .addBaseUrl('https://api.example.com')
      .addRoute('/test')

    await expect(api.send()).rejects.toThrow()
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('API request failed'))
  })
})
