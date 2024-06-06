import { deleteFiles, uploadFiles } from '../../externalServices/storageService';
import { IWorkspace } from './interface';
import { WorkspaceService } from './service';

export class WorkspaceManager {
    static async getDir(path: IWorkspace['path']) {
        return WorkspaceService.getDir(path);
    }

    static async getFile(path: IWorkspace['path']) {
        return WorkspaceService.getFile(path);
    }

    static async getById(id: string) {
        return WorkspaceService.getById(id);
    }

    private static async uploadFilesWrapper(files: Express.Multer.File[]) {
        if (!files.length) return {};

        const fileIds = await uploadFiles(files);

        return files.reduce(
            (acc, { fieldname }, index) => ({ ...acc, [fieldname]: fileIds[index] }),
            {} as Pick<IWorkspace, 'iconFileId' | 'logoFileId'>,
        );
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>, files: Express.Multer.File[]) {
        const fileProperties = await WorkspaceManager.uploadFilesWrapper(files);

        return WorkspaceService.createOne({ ...workspace, ...fileProperties });
    }

    private static async deleteFilesWrapper(id: string, deleteFunc: () => Promise<any>) {
        try {
            return deleteFunc();
        } catch (error) {
            console.log(`failed to delete files of workspaceId ${id}`); // eslint-disable-line no-console
            return [];
        }
    }

    private static async deleteUnusedFiles(workspace: IWorkspace, updatedWorkspace: Omit<IWorkspace, '_id'>) {
        const filesToDelete: string[] = [];

        if (workspace.iconFileId && workspace.iconFileId !== updatedWorkspace.iconFileId) filesToDelete.push(workspace.iconFileId);
        if (workspace.logoFileId && workspace.logoFileId !== updatedWorkspace.logoFileId) filesToDelete.push(workspace.logoFileId);

        return !filesToDelete.length ? [] : deleteFiles(filesToDelete);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>, files: Express.Multer.File[]) {
        const [oldWorkspace, fileProperties] = await Promise.all([WorkspaceService.getById(id), WorkspaceManager.uploadFilesWrapper(files)]);

        const updatedWorkspace = await WorkspaceService.updateOne(id, { ...workspace, ...fileProperties });

        await WorkspaceManager.deleteFilesWrapper(id, () => WorkspaceManager.deleteUnusedFiles(oldWorkspace, updatedWorkspace));

        return updatedWorkspace;
    }

    static async deleteOne(id: string) {
        const { iconFileId, logoFileId } = await WorkspaceService.getById(id);

        await WorkspaceManager.deleteFilesWrapper(id, () => deleteFiles([iconFileId, logoFileId].filter(Boolean) as string[]));

        return WorkspaceService.deleteOne(id);
    }
}
