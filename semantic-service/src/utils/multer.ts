import { FILE_EXTENSION_TO_MIME_TYPE, FileMimeType } from '@packages/semantic-search';
import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import config from '../config';

const { maxRequestSize } = config.service;

export const ALLOWED_MIMETYPES = Object.values(FILE_EXTENSION_TO_MIME_TYPE);

export const createFileUploadMiddleware = () =>
    multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: maxRequestSize,
        },
        fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIMETYPES.includes(file.mimetype as FileMimeType)) {
                cb(null, true);
            } else {
                cb(new ServiceError(StatusCodes.BAD_REQUEST, 'Only PDF, DOC, DOCX, and PPTX files are allowed'));
            }
        },
    });
