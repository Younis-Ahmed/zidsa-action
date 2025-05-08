/* eslint-disable node/prefer-global/buffer */
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
    let formHeaders = {}

    if (this.method !== 'GET') {
      // Special handling for FormData - convert it to a buffer for compatibility with fetch
      if (this.body instanceof FormData) {
        requestBody = await new Promise((resolve, reject) => {
          const formData = this.body as FormData
          const chunks: Buffer[] = []
          formData.on('data', chunk => chunks.push(chunk))
          formData.on('end', () => resolve(Buffer.concat(chunks)))
          formData.on('error', err => reject(err))
        })

        try {
          formHeaders = this.body.getHeaders ? this.body.getHeaders() : {}
          logger.log(`Using FormData headers for request ${JSON.stringify(formHeaders)}`)
        }
        catch (err) {
          logger.error(`Failed to get FormData headers: ${err instanceof Error ? err.message : String(err)}`)
        }

        // Remove our manually set Content-Type to avoid conflict with the FormData generated one
        delete this.headers['Content-Type']
      }
      else {
        requestBody = JSON.stringify(this.body)
        this.headers['Content-Type'] = 'application/json'
      }
    }

    const options = {
      method: this.method,
      headers: {
        ...this.headers,
        ...formHeaders, // Merge in the FormData headers which include the proper boundary
      },
      body: requestBody,
    }

    try {
      // Log request details for debugging
      logger.log(`Making request to: ${url}`)
      logger.log(`Request method: ${this.method}`)
      logger.log(`Request headers: ${JSON.stringify(options.headers, null, 2)}`)
      logger.log(`Request body: ${requestBody}`)
      logger.log(`Request params: ${this.params}`)
      logger.log(`Request key: ${this.key}`)
      logger.log(`Request body: ${requestBody}`)
      logger.log(`Request form headers: ${JSON.stringify(formHeaders)}`)
      logger.log(`Request form data: ${this.body}`)
      logger.log(`Request token: ${this.token}`)
      const response = await fetch(url, options)

      if (!response.ok) {
        if (response.status === 401) {
          logger.error('Token expired, please login again')
          throw new Error('Token expired, please login again')
        }
        let errorMessage = ''
        try {
          // Try to parse error as JSON
          const data = await response.json()
          errorMessage = typeof data === 'object' ? JSON.stringify(data) : String(data)
        }
        catch {
          try {
            // Fallback: try to get text
            const text = await response.text()
            errorMessage = text
          }
          catch {
            errorMessage = `Request failed with status ${response.status}`
          }
        }
        logger.error(`API request failed: ${errorMessage}`)
        throw new Error(errorMessage)
      }

      return (await response.json()) as T
    }
    catch (error) {
      let errorMessage: string = ''
      // Try to extract error details from fetch Response object
      if (error && typeof error === 'object' && ('json' in error || 'text' in error)) {
        try {
          if ('json' in error && typeof error.json === 'function') {
            const data = await error.json()
            errorMessage = typeof data === 'object' ? JSON.stringify(data) : String(data)
          }
          else if ('text' in error && typeof error.text === 'function') {
            const text = await error.text()
            errorMessage = text
          }
          else {
            errorMessage = '[Unknown fetch error object]'
          }
        }
        catch {
          errorMessage = '[Unable to parse error response]'
        }
      }
      else if (error instanceof Error) {
        errorMessage = error.message
      }
      else {
        try {
          errorMessage = JSON.stringify(error)
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
