import { UploadedFile } from '../express/files/interface';

declare global {
    namespace Express {
        export interface Request {
            files?: UploadedFile[];
            file?: UploadedFile;
        }
    }
}
