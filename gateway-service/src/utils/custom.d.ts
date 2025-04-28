import { UploadedFile } from './busboy/interface';

declare global {
    namespace Express {
        export interface Request {
            files?: UploadedFile[];
            file?: UploadedFile;
        }
    }
}
