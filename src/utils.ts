import * as core from '@actions/core'


export type VariableKey = 'EMAIL' | 'PASSWORD' | 'THEME_ID' | 'GITHUB_TOKEN';

export interface Variable {
    EMAIL: string;
    PASSWORD: string;
    THEME_ID: string;
    GITHUB_TOKEN: string;
}

/**
 * Gets values for the specified GitHub Action input variables
 * @param variables Array of variable keys to retrieve
 * @returns Object containing the requested variables and their values
 */
export function getVariables<T extends VariableKey>(variables: T[]): Pick<Variable, T> {
    return variables.reduce((acc, variable) => {
        acc[variable] = core.getInput(variable);
        return acc;
    }, {} as Pick<Variable, T>);
}
