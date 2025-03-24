import * as core from '@actions/core'


export interface Variable {
    email: string
    password: string
    theme_id: string
    github_token: string
}

export function getVariable(): Variable {
    const email = core.getInput('EMAIL')
    const password = core.getInput('PASSWORD')
    const theme_id = core.getInput('THEME_ID')
    const github_token = core.getInput('GITHUB_TOKEN')
    return {email, password, theme_id, github_token}
}