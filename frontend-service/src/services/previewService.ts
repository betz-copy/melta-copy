import { pdfjs } from 'react-pdf';
import axios from '../axios';
import { environment } from '../globals';

const { preview } = environment.api;
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const getFilePreviewRequest = async (path: string, contentType: string) => {
    const { data } = await axios.get(`${preview}/${path}`, {
        responseType: 'blob',
        params: { contentType },
    });
    return URL.createObjectURL(data);
};

export { getFilePreviewRequest };
