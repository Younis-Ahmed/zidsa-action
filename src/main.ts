import * as core from '@actions/core'
import { login } from './login.js'
import { getVariables, getWorkspacePath } from './utils.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const variables = getVariables(['EMAIL', 'PASSWORD', 'THEME_ID'])
    const workspacePath = getWorkspacePath()
    login(variables.EMAIL, variables.PASSWORD)
  }
  catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error)
      core.setFailed(error.message)
  }
}
