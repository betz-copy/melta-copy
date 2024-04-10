import { useQuery } from 'react-query';
import { getFilePreviewRequest } from '../services/previewService';

export const useFilePreview = (fileId: string, contentType: string) => {
    return useQuery(
        ['preview', fileId],
        () => {
            if (contentType === 'unsupported') {
                return contentType;
            }
            const needsConversion = !['image', 'video', 'audio', 'pdf'].includes(contentType);
            return getFilePreviewRequest(fileId, needsConversion);
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: false,
            enabled: false,
            // onError: () => {
            //     toast.error(i18next.t('errorPage.filePrintError'));
            // },
        },
    );
};
