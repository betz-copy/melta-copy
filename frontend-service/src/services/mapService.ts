import { CswClient } from '@map-colonies/csw-client';
import axios, { Method } from 'axios';

export const getCswClient = (baseUrl: string, token: string): CswClient => {
    const requestExecutor = async (method: string, url: string, data: any) => {
        const response = await axios({
            method: method as Method,
            url: url,
            data,
            headers: {
                'x-api-key': token,
                'Content-Type': 'application/xml',
            },
        });

        return response.data;
    };

    return new CswClient(baseUrl, requestExecutor);
};
