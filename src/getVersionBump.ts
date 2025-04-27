/* eslint-disable regexp/no-unused-capturing-group */
import { execSync } from 'node:child_process'
// import * as fs from 'node:fs'
import * as path from 'node:path'

export interface BumperRecommendation {
  releaseType: 'major' | 'minor' | 'patch'
  reason: string
}

/**
 * Determines the appropriate version bump based on commit messages
 *
 * @param build_path Directory path to analyze
 * @returns BumperRecommendation with releaseType and reason
 */
export async function getVersionBump(
  build_path: string,
): Promise<BumperRecommendation> {
  try {
    // Get the commit history for the specified build path
    const repoPath = path.resolve(build_path)
    const gitLogCmd = `git log -n 15 --pretty=format:"%s" -- ${repoPath}`
    const output = execSync(gitLogCmd, { encoding: 'utf8' })
    const commitMessages = output ? output.split('\n') : []

    // If no commits are found, default to patch
    if (!commitMessages.length || !output.trim()) {
      return {
        releaseType: 'patch',
        reason: 'No recent commits found, defaulting to patch release',
      }
    }

    // Rules for determining version bump based on commit messages
    const hasMajorChange = commitMessages.some(msg =>
      /break(ing)?[ -]?change/i.test(msg)
      || /BREAKING CHANGE/i.test(msg)
      || /^feat!:/i.test(msg),
    )

    const hasFeature = commitMessages.some(msg =>
      /^feat(\(.*\))?:/i.test(msg)
      || /add(ed|ing)?( new)? feature/i.test(msg),
    )

    // Determine the appropriate version bump type
    if (hasMajorChange) {
      return {
        releaseType: 'major',
        reason: 'Breaking changes detected in recent commits',
      }
    }
    else if (hasFeature) {
      return {
        releaseType: 'minor',
        reason: 'New features detected in recent commits',
      }
    }
    else {
      return {
        releaseType: 'patch',
        reason: 'Bug fixes and improvements detected in recent commits',
      }
    }
  }
  catch (error) {
    console.error('Error determining version bump:', error)
    // Default to patch if there's any error in the process
    return {
      releaseType: 'patch',
      reason: 'Using default patch release due to error analyzing commits',
    }
  }
}
