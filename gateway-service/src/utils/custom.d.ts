import { UploadedFile, IEntityWithDirectRelationships } from '@microservices/shared';

declare global {
    namespace Express {
        export interface Request {
            files?: UploadedFile[];
            file?: UploadedFile;
            clientSideUserEntity?: IEntityWithDirectRelationships;
        }
    }
}
