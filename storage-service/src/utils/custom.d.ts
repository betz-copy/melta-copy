import { UploadedFile } from '@microservices/shared';

declare global {
    namespace Express {
        export interface Request {
            files?: UploadedFile[];
            file?: UploadedFile;
        }
    }
}
