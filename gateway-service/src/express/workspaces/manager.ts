/* eslint-disable no-param-reassign */
import config from '../../config';
import { StorageService } from '../../externalServices/storageService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { ICompact, IPermission, ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IWorkspace } from './interface';
import { WorkspaceService } from './service';

export class WorkspaceManager {
    private static storageService = new StorageService(config.workspaceService.dbName);

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

        const fileIds = await this.storageService.uploadFiles(files);

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

        return !filesToDelete.length ? [] : this.storageService.deleteFiles(filesToDelete);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>, files: Express.Multer.File[]) {
        const [oldWorkspace, fileProperties] = await Promise.all([WorkspaceService.getById(id), WorkspaceManager.uploadFilesWrapper(files)]);

        const updatedWorkspace = await WorkspaceService.updateOne(id, { ...workspace, ...fileProperties });

        await WorkspaceManager.deleteFilesWrapper(id, () => WorkspaceManager.deleteUnusedFiles(oldWorkspace, updatedWorkspace));

        return updatedWorkspace;
    }

    static async deleteOne(id: string) {
        const { iconFileId, logoFileId } = await WorkspaceService.getById(id);

        await WorkspaceManager.deleteFilesWrapper(id, () => this.storageService.deleteFiles([iconFileId, logoFileId].filter(Boolean) as string[]));

        return WorkspaceService.deleteOne(id);
    }

    static async getWorkspacePermissions(workspaceId: string, userId: string): Promise<ISubCompactPermissions> {
        const workspace = await this.getById(workspaceId);

        const workspaceHierarchyIds = workspace.path.split('/');
        workspaceHierarchyIds.push(workspaceId);

        const permissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

        const workspacePermissions: ISubCompactPermissions = {};

        workspaceHierarchyIds.forEach((id) => {
            if (!permissions[id]) return;
            this.mergeSubCompactPermissions(workspacePermissions, permissions[id]);
        });

        return workspacePermissions;
    }

    private static mergeSubCompactPermissions(original: ISubCompactPermissions, addition: ISubCompactPermissions) {
        Object.keys(addition).forEach((permissionType) => {
            if (!original[permissionType]) {
                original[permissionType] = addition[permissionType];
                return;
            }

            original[permissionType] = this.mergeCompactPermission(original[permissionType], addition[permissionType]);
        });
    }

    private static mergeCompactPermission(original: ICompact<IPermission>, addition: ICompact<IPermission>): ICompact<IPermission> {
        if (original.scope === PermissionScope.write || addition.scope === PermissionScope.write) return { scope: PermissionScope.write };
        if (addition.scope) original.scope = addition.scope;

        Object.keys(addition).forEach((subClass) => {
            if (subClass === 'scope') return;
            if (!original[subClass]) {
                original[subClass] = addition[subClass];
                return;
            }

            Object.keys(addition[subClass]).forEach((id) => {
                if (!original[subClass][id]) {
                    original[subClass][id] = addition[subClass][id];
                    return;
                }

                original[subClass][id] = this.mergeCompactPermission(original[subClass][id], addition[subClass][id]);
            });
        });

        return original;
    }
}
