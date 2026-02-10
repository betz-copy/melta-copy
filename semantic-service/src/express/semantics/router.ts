import { ValidateRequest, wrapController } from '@packages/utils';
import { Router } from 'express';
import multer from 'multer';
import config from '../../config';
import SemanticController from './controller';
import { summarizeRequestSchema } from './validator.schema';

const { maxUploadFiles, maxRequestSize } = config.service;

const semanticRouter: Router = Router();

const ALLOWED_MIMETYPES = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxRequestSize,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOC/DOCX files are allowed'));
        }
    },
});

semanticRouter.post(
    '/summarize',
    upload.array('files', maxUploadFiles),
    ValidateRequest(summarizeRequestSchema),
    wrapController(SemanticController.summarize),
);

export default semanticRouter;
