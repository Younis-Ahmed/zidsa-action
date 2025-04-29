import FormData from 'form-data'
import logger from './logger.js'
import { getToken } from './token.js'

class Api {
  private baseUrl = ''
  private headers = {} as Record<string, string>
  private route = ''
  private method = 'GET'
  private body: unknown = {}
  private token = ''
  private params = '' as string
  private key = '' as string

  constructor() {
    this.token = getToken()
  }

  public addBaseUrl(baseUrl?: string) {
    this.baseUrl = baseUrl || 'https://api.zid.sa/v1'
    return this
  }

  public addParams(params?: { key: string, value: string | string[] }[]) {
    params
    && params.length > 0
    && params?.map(
      ({ key, value }) =>
        (this.params += `${this.params === '' ? '?' : '&'}${key}=${
          Array.isArray(value) ? value.join(',') : value
        }`),
    )
    return this
  }

  public addFormData(formData: FormData) {
    this.body = formData
    this.headers['Content-Type'] = 'multipart/form-data'
    return this
  }

  public addKey(key: string) {
    this.key = this.key ? `${this.key}/${key}` : `/${key}`
    return this
  }

  public addHeaders(headers: { key: string, value: string }[]) {
    headers.forEach(({ key, value }) => (this.headers[key] = value))
    return this
  }

  public addUserToken() {
    this.headers['x-partner-token'] = `${this.token}`
    return this
  }

  public addRoute(endpoint: string) {
    this.route = `${this.baseUrl}${endpoint}`
    return this
  }

  public addBody(body: unknown) {
    this.body = body
    if (!(body instanceof FormData)) {
      this.headers['Content-Type'] = 'application/json'
    }
    return this
  }

  public post() {
    this.method = 'POST'
    return this
  }

  public get() {
    this.method = 'GET'
    return this
  }

  public put() {
    this.method = 'PUT'
    return this
  }

  public delete() {
    this.method = 'DELETE'
    return this
  }

  public reset() {
    this.baseUrl = ''
    this.headers = {}
    this.route = ''
    this.method = 'GET'
    this.body = {}
    this.params = ''
    this.key = ''
    return this
  }

  public async send<T = unknown>(): Promise<T> {
    const url = `${this.route}${this.key}${this.params}`
    let requestBody: any

    if (this.method !== 'GET') {
      // Special handling for FormData - don't stringify it
      if (this.body instanceof FormData) {
        requestBody = this.body
        // When using FormData, let the browser set the Content-Type with boundary
        delete this.headers['Content-Type']
      }
      else {
        requestBody = JSON.stringify(this.body)
      }
    }

    const options = {
      method: this.method,
      headers: this.headers,
      body: requestBody,
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        if (response.status === 401) {
          logger.error('Token expired, please login again')
          throw new Error('Token expired, please login again')
        }

        const data = await response.json()
        const message
          = typeof data === 'object' && data !== null && 'message' in data
            ? (data.message as string)
            : `Request failed with status ${response.status}`
        throw new Error(message)
      }

      return (await response.json()) as T
    }
    catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      }
      else {
        try {
          // Improved error object handling
          if (typeof error === 'object' && error !== null) {
            // Try to extract meaningful properties from the error object
            const errorObj = error as Record<string, unknown>
            const details = Object.entries(errorObj)
              .filter(([_, value]) => value !== undefined && value !== null)
              .map(([key, value]) => {
                try {
                  return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
                }
                catch {
                  return `${key}: [Complex Value]`
                }
              })
              .join(', ')

            errorMessage = details || JSON.stringify(error)
          }
          else {
            errorMessage = JSON.stringify(error)
          }
        }
        catch {
          errorMessage = String(error)
        }
      }
      logger.error(`API request failed: ${errorMessage}`)
      throw new Error(`API error: ${errorMessage}`)
    }
  }
}

export default Api
