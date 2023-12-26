import { pdfjs } from 'react-pdf';
import axios from '../axios';
import { environment } from '../globals';

const { preview } = environment.api;
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const getFilePreviewRequest = async (path: string, needsConversion: boolean) => {
    const { data } = await axios.get(`${preview}/${path}/${needsConversion}`, { responseType: 'blob' });
    return URL.createObjectURL(data);
};

export { getFilePreviewRequest };
