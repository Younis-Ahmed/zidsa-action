import { setToken } from "./token.js";

interface LoginResponse {
    partner?: {
        'x-partner-token'?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export const login = async (email: string, password: string): Promise<void> => {
    try {
        const response = await fetch('https://api.zid.sa/v1/market/partner-login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            email,
            password
            })
        });
        
        const { partner } = await response.json() as LoginResponse
        
        if (partner && partner['x-partner-token']) {
            if (!setToken(partner['x-partner-token'])) {
                console.log('Failed to save token.', 'red');
                throw new Error('Failed to save token');
            }
            console.log('Authentication successful!');
        } else {
            console.log('Authentication failed. Invalid response from server.', 'red');
            throw new Error('Invalid response from server');
        }
    } catch (error) {
        console.log('Authentication failed', 'red');
        throw error;
    }
}