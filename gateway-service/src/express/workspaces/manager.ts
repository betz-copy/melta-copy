import { StorageService } from '../../externalServices/storageService';
import DefaultManagerProxy from '../../utils/express/manager';
import { IWorkspace } from './interface';
import { WorkspaceService } from './service';

export class WorkspaceManager extends DefaultManagerProxy {
    private storageService: StorageService;

    constructor(workspaceId: string) {
        super(null);
        this.storageService = new StorageService(workspaceId);
    }

    static async getWorkspaceIds(type: IWorkspace['type']) {
        return WorkspaceService.getWorkspaceIds(type);
    }

    static async getWorkspaceHierarchyIds(id: string) {
        return WorkspaceService.getWorkspaceHierarchyIds(id);
    }

    static async getDir(path: IWorkspace['path']) {
        return WorkspaceService.getDir(path);
    }

    static async getFile(path: IWorkspace['path']) {
        return WorkspaceService.getFile(path);
    }

    static async getById(id: string) {
        return WorkspaceService.getById(id);
    }

    private async uploadFilesWrapper(files: Express.Multer.File[]) {
        if (!files.length) return {};

        const fileIds = await this.storageService.uploadFiles(files);

        return files.reduce(
            (acc, { fieldname }, index) => ({ ...acc, [fieldname]: fileIds[index] }),
            {} as Pick<IWorkspace, 'iconFileId' | 'logoFileId'>,
        );
    }

    async createOne(workspace: Omit<IWorkspace, '_id'>, files: Express.Multer.File[]) {
        const fileProperties = await this.uploadFilesWrapper(files);

        return WorkspaceService.createOne({ ...workspace, ...fileProperties });
    }

    private async deleteFilesWrapper(id: string, deleteFunc: () => Promise<any>) {
        try {
            return deleteFunc();
        } catch (error) {
            console.log(`failed to delete files of workspaceId ${id}`); // eslint-disable-line no-console
            return [];
        }
    }

    private async deleteUnusedFiles(workspace: IWorkspace, updatedWorkspace: Omit<IWorkspace, '_id'>) {
        const filesToDelete: string[] = [];

        if (workspace.iconFileId && workspace.iconFileId !== updatedWorkspace.iconFileId) filesToDelete.push(workspace.iconFileId);
        if (workspace.logoFileId && workspace.logoFileId !== updatedWorkspace.logoFileId) filesToDelete.push(workspace.logoFileId);

        return !filesToDelete.length ? [] : this.storageService.deleteFiles(filesToDelete);
    }

    async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>, files: Express.Multer.File[]) {
        const [oldWorkspace, fileProperties] = await Promise.all([WorkspaceService.getById(id), this.uploadFilesWrapper(files)]);

        const updatedWorkspace = await WorkspaceService.updateOne(id, { ...workspace, ...fileProperties });

        await this.deleteFilesWrapper(id, () => this.deleteUnusedFiles(oldWorkspace, updatedWorkspace));

        return updatedWorkspace;
    }

    async deleteOne(id: string) {
        const { iconFileId, logoFileId } = await WorkspaceService.getById(id);

        await this.deleteFilesWrapper(id, () => this.storageService.deleteFiles([iconFileId, logoFileId].filter(Boolean) as string[]));

        return WorkspaceService.deleteOne(id);
    }
}
