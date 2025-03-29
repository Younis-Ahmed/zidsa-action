import fs from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import logger from './logger.js'

const homeDir = homedir()
const configDir = path.join(homeDir, '.zid-theme')
export const configPath = path.join(configDir, 'config.json')

function getToken() {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (config.access_token) {
      return config.access_token
    }
  }
  logger.log('No session found. Attempting login first.')
  return null
}

function setToken(token: string) {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Write file synchronously to ensure proper return value
    fs.writeFileSync(configPath, JSON.stringify({ access_token: token }))
    return true
  }
  catch (err) {
    logger.error(`Failed to save token: ${err}`)
    return false
  }
}

export { getToken, setToken }
