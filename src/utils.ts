import * as core from '@actions/core'


export type VariableKey = 'EMAIL' | 'PASSWORD' | 'THEME_ID'

export interface Variables {
    EMAIL: string;
    PASSWORD: string;
    THEME_ID: string;
}

/**
 * Gets values for the specified GitHub Action input variables
 * @param variables Array of variable keys to retrieve
 * @returns Object containing the requested variables and their values
 */
export function getVariables<T extends VariableKey>(variables: T[]): Pick<Variables, T> {
    return variables.reduce((acc, variable) => {
        acc[variable] = core.getInput(variable);
        return acc;
    }, {} as Pick<Variables, T>);
}
