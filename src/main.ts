/* eslint-disable unused-imports/no-unused-vars */
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
    core.info(`variables: ${JSON.stringify(variables)}`)
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
      // Improved object error handling
      try {
        const errorMessage = typeof error === 'object' && error !== null
          ? JSON.stringify(error, null, 2) // Pretty print with indentation
          : String(error)

        core.setFailed(`An unexpected error occurred: ${errorMessage}`)
      }
      catch (stringifyError) {
        // Fallback if JSON.stringify fails
        core.setFailed(`An unexpected error occurred: ${String(error)}`)
      }
    }
  }
}
