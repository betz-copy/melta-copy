import { useQuery } from 'react-query';
import React from 'react';
import { IFile } from '../interfaces/preview';
import { getFilePreviewRequest } from '../services/previewService';

export const useFilePreview = (
    fileId: IFile['id'],
    contentType: IFile['contentType'],
    setNoSuchKeyError: React.Dispatch<React.SetStateAction<boolean>>,
) => {
    return useQuery(
        ['preview', fileId],
        () => {
            if (contentType === 'unsupported') {
                return contentType;
            }
            return getFilePreviewRequest(fileId, contentType);
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: false,
            onError: (error: any) => {
                setNoSuchKeyError(error?.response?.status === 404);
            },
        },
    );
};
