import * as core from '@actions/core'
import { getVariables, type Variables } from './utils.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
    try {
      const variables: Variables = getVariables(['EMAIL', 'PASSWORD', 'THEME_ID']);

    } catch (error) {
      // Fail the workflow run if an error occurs
      if (error instanceof Error) core.setFailed(error.message)
    }
  }