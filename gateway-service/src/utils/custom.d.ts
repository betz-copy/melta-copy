import { IEntityWithDirectRelationships, UploadedFile } from '@packages/entity';

declare global {
    namespace Express {
        export interface Request {
            files?: UploadedFile[];
            file?: UploadedFile;
            clientSideUserEntity?: IEntityWithDirectRelationships;
        }
    }
}
