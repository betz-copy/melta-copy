import { IWorkspace, UploadedFile } from '@microservices/shared';
import config from '../../config';
import StorageService from '../../externalServices/storageService';
import DefaultManagerProxy from '../../utils/express/manager';
import { UserNotAuthorizedError } from '../error';
import UsersManager from '../users/manager';
import WorkspaceService from './service';

const {
    service: { meltaBaseUrl },
} = config;

class WorkspaceManager extends DefaultManagerProxy {
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

    static async getDir(path: IWorkspace['path'], userId: string) {
        const [workspace, workspaces, { permissions }] = await Promise.all([
            WorkspaceManager.getFile(path),
            WorkspaceService.getDir(path),
            UsersManager.getUserById(userId),
        ]);

        const hierarchy = [...(await WorkspaceManager.getWorkspaceHierarchyIds(workspace._id)), workspace._id];
        if (hierarchy.some((id) => permissions[id])) return workspaces;

        const allPermissionsHierarchies = new Set(
            (await Promise.all(Object.keys(permissions).map((id) => WorkspaceManager.getWorkspaceHierarchyIds(id)))).flat(),
        );

        const allowedWorkspaces = workspaces.filter(({ _id }) => permissions[_id] || allPermissionsHierarchies.has(_id));

        if (!allowedWorkspaces.length) throw new UserNotAuthorizedError();

        return allowedWorkspaces;
    }

    static async getFile(path: IWorkspace['path']) {
        return WorkspaceService.getFile(path);
    }

    static async getById(id: string) {
        return WorkspaceService.getById(id);
    }

    private async uploadFilesWrapper(files: UploadedFile[]) {
        if (!files.length) return {};

        const fileIds = await this.storageService.uploadFiles(files);

        const result = {} as Pick<IWorkspace, 'iconFileId' | 'logoFileId'>;
        files.forEach(({ fieldname }, index) => {
            result[fieldname] = fileIds[index];
        });
        return result;
    }

    async createOne(workspace: Omit<IWorkspace, '_id'>, files: UploadedFile[]) {
        const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...createdWorkspace } = await WorkspaceService.createOne(workspace);

        this.storageService = new StorageService(_id);
        const fileProperties = await this.uploadFilesWrapper(files);

        return this.updateOne(_id, { ...createdWorkspace, ...fileProperties }, []);
    }

    private async deleteFilesWrapper(id: string, deleteFunc: () => Promise<any>) {
        try {
            return deleteFunc();
        } catch (error) {
            console.error(`failed to delete files of workspaceId ${id}`, { error });
            return [];
        }
    }

    private async deleteUnusedFiles(workspace: IWorkspace, updatedWorkspace: Omit<IWorkspace, '_id'>) {
        const filesToDelete: string[] = [];

        if (workspace.iconFileId && workspace.iconFileId !== updatedWorkspace.iconFileId) filesToDelete.push(workspace.iconFileId);
        if (workspace.logoFileId && workspace.logoFileId !== updatedWorkspace.logoFileId) filesToDelete.push(workspace.logoFileId);

        return !filesToDelete.length ? [] : this.storageService.deleteFiles(filesToDelete);
    }

    async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>, files: UploadedFile[]) {
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

    static async getBaseUrl(workspaceId: string) {
        const workspace: IWorkspace = await WorkspaceService.getById(workspaceId);

        return `${meltaBaseUrl}${workspace.path}/${workspace.name}${workspace.type}`;
    }
}

export default WorkspaceManager;
