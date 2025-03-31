import * as core from '@actions/core'
import { login } from './login.js'
import updateTheme from './update.js'
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
    await login(variables.EMAIL, variables.PASSWORD)
    await updateTheme(variables.THEME_ID, workspacePath)

    // Log a success message
    core.info('Theme updated successfully')
    core.setOutput('success', 'true')
  }
  catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
    else {
      // Handle non-Error exceptions too
      core.setFailed(`An unexpected error occurred: ${String(error)}`)
    }
  }
}
