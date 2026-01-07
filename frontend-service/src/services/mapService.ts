import axios from 'axios';

export const getMapLayer = async (url: string, params: Record<string, string>, body: string, token: string) => {
    const { data } = await axios.post<string>(url, body, {
        headers: {
            'x-api-key': token,
            'Content-Type': 'application/xml',
        },
        params,
    });

    return data;
};
