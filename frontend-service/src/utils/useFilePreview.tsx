import { useQuery } from 'react-query';
import { getFilePreviewRequest } from '../services/previewService';
import { FileExtensions } from '../interfaces/preview';

export const useFilePreview = (fileId: string, contentType: string, targetExtension?: FileExtensions) => {
    return useQuery(
        ['preview', fileId],
        () => {
            if (contentType === 'unsupported') {
                return contentType;
            }
            const needsConversion = !['image', 'video', 'audio', 'pdf'].includes(contentType);
            return getFilePreviewRequest(fileId, needsConversion, targetExtension);
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: true,
        },
    );
};
