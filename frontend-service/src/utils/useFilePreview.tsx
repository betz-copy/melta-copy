import { useQuery } from 'react-query';
import { IFile } from '../interfaces/preview';
import { getFilePreviewRequest } from '../services/previewService';

export const useFilePreview = (fileId: IFile['id'], contentType: IFile['contentType'], targetExtension?: IFile['targetExtension']) => {
    return useQuery(
        ['preview', fileId, contentType, targetExtension],
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
