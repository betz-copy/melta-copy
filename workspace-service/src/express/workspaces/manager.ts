import { parse as parsePath } from 'node:path/posix';
import { DocumentNotFoundError, PathDoesNotExistError, PathIsNotFolderError } from '../error';
import { IWorkspace, WorkspaceTypes } from './interface';
import { WorkspacesModel } from './model';

export class WorkspacesManager {
    static async getDir(path: IWorkspace['path']) {
        const { ext } = parsePath(path);
        if (ext !== WorkspaceTypes.dir) throw new PathIsNotFolderError(path);

        return WorkspacesModel.find({ path }).lean().exec();
    }

    static async getFile(path: IWorkspace['path']) {
        const { dir, name, ext } = parsePath(path);

        return WorkspacesModel.findOne({ path: dir, name, type: ext }).orFail(new PathDoesNotExistError(path)).lean().exec();
    }

    static async getById(id: string) {
        return WorkspacesModel.findById(id).orFail(new DocumentNotFoundError(id)).lean().exec();
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        const { dir, name } = parsePath(workspace.path);

        await WorkspacesModel.findOne({ path: dir, name, type: WorkspaceTypes.dir }).orFail(new PathDoesNotExistError(workspace.path)).lean().exec();

        return WorkspacesModel.create(workspace);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        return WorkspacesModel.findByIdAndUpdate(id, workspace, { new: true, overwrite: true }).orFail(new DocumentNotFoundError(id)).lean().exec();
    }

    static async deleteOne(id: string) {
        return WorkspacesModel.findByIdAndDelete(id).orFail(new DocumentNotFoundError(id)).lean().exec();
    }
}
