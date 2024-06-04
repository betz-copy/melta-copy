import { FilterQuery } from 'mongoose';
import { parse as parsePath } from 'node:path/posix';
import { transaction } from '../../utils/mongoose';
import { DocumentNotFoundError, PathDoesNotExistError, PathIsNotFolderError, WorkspaceUnderRootMustBeDirError } from '../error';
import { IWorkspace, WorkspaceTypes } from './interface';
import { WorkspacesModel } from './model';

export class WorkspacesManager {
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

    static async validateRoot(path: IWorkspace['path'], type: IWorkspace['type']) {
        if (path === '/' && type !== WorkspaceTypes.dir) throw new WorkspaceUnderRootMustBeDirError();
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        await Promise.all([WorkspacesManager.handleDirExists(workspace.path), WorkspacesManager.validateRoot(workspace.path, workspace.type)]);

        return WorkspacesModel.create(workspace);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        await Promise.all([WorkspacesManager.handleDirExists(workspace.path), WorkspacesManager.validateRoot(workspace.path, workspace.type)]);

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
}
