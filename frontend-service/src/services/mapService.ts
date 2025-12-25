import axios from 'axios';

export const getMapLayer = async (url: string, params: any, body: any, token: string) => {
    const { data } = await axios.post<string>(url, body, {
        headers: {
            'x-api-key': token,
            'Content-Type': 'application/xml',
        },
        params,
    });

    return data;
};
