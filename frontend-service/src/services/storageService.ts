import axios from '../axios';

export type ApiUrl = `/api/files/${string}`;

export const apiUrlToImageSource = async (url: ApiUrl) => {
    const { data } = await axios.get(url, { baseURL: '', responseType: 'blob' });
    return URL.createObjectURL(data);
};
