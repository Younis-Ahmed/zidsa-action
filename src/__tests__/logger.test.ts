import * as core from '@actions/core'
import { describe, expect, it, vi } from 'vitest'
import logger from '../logger.js'

// Spy on the core logger functions from @actions/core
vi.spyOn(core, 'notice').mockImplementation(() => {})
vi.spyOn(core, 'warning').mockImplementation(() => {})
vi.spyOn(core, 'error').mockImplementation(() => {})

describe('logger', () => {
  it('should log messages using notice', () => {
    const spy = vi.spyOn(core, 'notice')
    logger.log('Test log')
    expect(spy).toHaveBeenCalledWith('Test log', undefined)
  })

  it('should log warnings using warning', () => {
    const spy = vi.spyOn(core, 'warning')
    logger.warning('Test warning')
    expect(spy).toHaveBeenCalledWith('Test warning', undefined)
  })

  it('should log errors using error', () => {
    const spy = vi.spyOn(core, 'error')
    logger.error('Test error')
    expect(spy).toHaveBeenCalledWith('Test error', undefined)
  })
})
