import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import FilesManager from './manager';

class FilesController extends DefaultController<FilesManager> {
    constructor(workspaceId: string) {
        super(new FilesManager(workspaceId));
    }

    async getFilePreview(req: Request, res: Response) {
        const { fileId } = req.params;
        const contentType = req.query.contentType as string;

        const resultStream = await this.manager.getFilePreview(fileId as string, contentType);

        res.setHeader('Content-Type', 'application/pdf');

        resultStream.pipe(res);
    }
}

export default FilesController;
