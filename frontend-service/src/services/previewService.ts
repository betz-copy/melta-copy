import { pdfjs } from 'react-pdf';
import axios from '../axios';
import { environment } from '../globals';
import { FileExtensions } from '../interfaces/preview';

const { preview } = environment.api;
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const getFilePreviewRequest = async (path: string, needsConversion: boolean, targetExtension?: FileExtensions) => {
    const { data } = await axios.get(`${preview}/${path}/${needsConversion}`, {
        responseType: 'blob',
        params: { targetExtension },
    });
    return URL.createObjectURL(data);
};

export { getFilePreviewRequest };
