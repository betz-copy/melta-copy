import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import React from 'react';
import { useQuery } from 'react-query';
import { IFile } from '../../interfaces/preview';
import { getFilePreviewRequest } from '../../services/previewService';

export const useFilePreview = (
    fileId: IFile['id'] | File,
    contentType: IFile['contentType'],
    setNoSuchKeyError: React.Dispatch<React.SetStateAction<boolean>>,
) => {
    return useQuery(
        ['preview', fileId],
        () => {
            if (contentType === 'unsupported') {
                return contentType;
            }

            if (typeof fileId === 'string') {
                return getFilePreviewRequest(fileId, contentType);
            }
            return URL.createObjectURL(fileId);
        },
        {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: false,
            onError: (error: AxiosError) => {
                setNoSuchKeyError(error?.response?.status === StatusCodes.NOT_FOUND);
            },
        },
    );
};
