import { pdfjs } from 'react-pdf';
import axios from '../axios';
import { environment } from '../globals';
import { FileExtensions } from '../interfaces/preview';

const { preview } = environment.api;
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const getFilePreviewRequest = async (path: string, needsConversion: boolean, targetExtension?: FileExtensions, isPdfPreview?: boolean) => {
    const { data } = await axios.get(`${preview}/${path}/${needsConversion}`, {
        responseType: 'blob',
        params: { targetExtension, isPdfPreview },
        timeout: 30000,
    });

    return URL.createObjectURL(data);
};

export { getFilePreviewRequest };
