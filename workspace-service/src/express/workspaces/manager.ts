import { FilterQuery } from 'mongoose';
import { parse as parsePath } from 'node:path/posix';
import { IMetadata, IWorkspace, WorkspaceTypes } from '@microservices/shared';
import { transaction } from '../../utils/mongoose';
import { DocumentNotFoundError, PathDoesNotExistError, PathIsNotFolderError, WorkspaceUnderRootMustBeDirError } from '../error';
import WorkspacesModel from './model';
import { escapeRegExp } from '../../utils/regex';

class WorkspacesManager {
    static async getWorkspaceIds(type: IWorkspace['type']) {
        const workspaces = await WorkspacesModel.find({ type }, { _id: 1 }).lean().exec();

        return workspaces.map(({ _id }) => _id);
    }

    static async getWorkspaceHierarchyIds(workspaceId: string) {
        let { path } = await WorkspacesManager.getById(workspaceId);

        const queries: FilterQuery<IWorkspace>[] = [];

        while (path !== '') {
            const lastSlashIndex = path.lastIndexOf('/');
            const parentPath = path.substring(0, lastSlashIndex);

            queries.unshift({ name: path.substring(lastSlashIndex + 1, path.length), path: parentPath === '' ? '/' : parentPath });

            path = parentPath;
        }

        if (queries[0].name !== '') queries.unshift({ name: '', path: '/' });

        const workspaceIds = await Promise.all(
            queries.map(async (query) => {
                const { _id } = await WorkspacesModel.findOne({ ...query, type: WorkspaceTypes.dir }, { _id: 1 })
                    .orFail(new PathDoesNotExistError(`${query.path}/${query.name}`))
                    .lean()
                    .exec();
                return _id;
            }),
        );

        workspaceIds.push(workspaceId);

        return workspaceIds;
    }

    static async getFile(path: IWorkspace['path']) {
        const { dir, name, ext } = parsePath(path);

        return WorkspacesModel.findOne({ path: dir, name, type: ext }).orFail(new PathDoesNotExistError(path)).lean().exec();
    }

    private static async handleDirExists(path: IWorkspace['path']) {
        const { type } = await WorkspacesManager.getFile(path);
        if (type !== WorkspaceTypes.dir) throw new PathIsNotFolderError(path);
    }

    static async getDir(path: IWorkspace['path']) {
        await WorkspacesManager.handleDirExists(path);

        const query: FilterQuery<IWorkspace> = { path };
        if (path === '/') query.name = { $ne: '' };

        return WorkspacesModel.find(query).sort({ name: 1 }).lean().exec();
    }

    static async getById(id: string) {
        return WorkspacesModel.findById(id).orFail(new DocumentNotFoundError(id)).lean().exec();
    }

    static validateRoot(path: IWorkspace['path'], type: IWorkspace['type']) {
        if (path === '/' && type !== WorkspaceTypes.dir) throw new WorkspaceUnderRootMustBeDirError();
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        WorkspacesManager.validateRoot(workspace.path, workspace.type);
        await WorkspacesManager.handleDirExists(workspace.path);

        return WorkspacesModel.create(workspace);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        WorkspacesManager.validateRoot(workspace.path, workspace.type);
        await WorkspacesManager.handleDirExists(workspace.path);

        return transaction(async (session) => {
            if (workspace.type === WorkspaceTypes.dir) {
                const currentWorkspace = await WorkspacesModel.findById(id, {}, { session }).orFail(new DocumentNotFoundError(id)).lean().exec();
                const oldPath = `${currentWorkspace.path}/${currentWorkspace.name}`;

                await WorkspacesModel.updateMany(
                    { path: { $regex: `^${oldPath}` } },
                    [
                        {
                            $set: {
                                path: {
                                    $replaceOne: {
                                        input: '$path',
                                        find: oldPath,
                                        replacement: `${workspace.path}/${workspace.name}`,
                                    },
                                },
                            },
                        },
                    ],
                    { session },
                );
            }

            return WorkspacesModel.findOneAndReplace({ _id: id }, workspace, { new: true, session })
                .orFail(new DocumentNotFoundError(id))
                .lean()
                .exec();
        });
    }

    static async deleteOne(id: string) {
        return transaction(async (session) => {
            const workspace = await WorkspacesModel.findById(id, {}, { session }).orFail(new DocumentNotFoundError(id)).lean().exec();

            if (workspace.type === WorkspaceTypes.dir) {
                await WorkspacesModel.deleteMany({ path: { $regex: `^${workspace.path}/${workspace.name}` } }, { session });
            }

            return WorkspacesModel.findByIdAndDelete(id, { session }).orFail(new DocumentNotFoundError(id)).lean().exec();
        });
    }

    static async updateMetadata(id: string, metadata: Partial<IMetadata>) {
        return transaction(async (session) => {
            const existingWorkspace = await WorkspacesModel.findById(id, {}, { session }).orFail(new DocumentNotFoundError(id)).lean().exec();

            const updatedMetadata = {
                ...existingWorkspace.metadata,
                ...metadata,
            };

            return WorkspacesModel.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        metadata: updatedMetadata,
                    },
                },
                { new: true, session, lean: true },
            )
                .orFail(new DocumentNotFoundError(id))
                .exec();
        });
    }

    static async searchWorkspaces(searchQuery: { search?: string }) {
        const { search: displayName } = searchQuery;
        const query: FilterQuery<IWorkspace> = {};

        if (displayName) {
            query.displayName = { $regex: escapeRegExp(displayName) };
        }

        query.type = WorkspaceTypes.mlt;

        return WorkspacesModel.find(query).sort({ name: 1 }).lean().exec();
    }
}

export default WorkspacesManager;
