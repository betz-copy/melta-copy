import { FilterQuery, Document } from 'mongoose';
import ProcessInstanceModel from './model';
import { IProcessInstance } from './interface';
import { ServiceError } from '../error';

export class ProcessInstanceManager {
    static getProcessById(processId: string) {
        return ProcessInstanceModel.findById(processId).orFail(new ServiceError(404, 'Process not found')).lean().exec();
    }

    static createProcess(process: IProcessInstance) {
        return ProcessInstanceModel.create(process);
    }

    static deleteProcess(id: string) {
        return ProcessInstanceModel.findByIdAndDelete(id).orFail(new ServiceError(404, 'Process not found')).lean().exec();
    }

    static updateProcess(id: string, updatedData: Omit<IProcessInstance, 'templateId'>) {
        return ProcessInstanceModel.findByIdAndUpdate(id, updatedData, { new: true })
            .orFail(new ServiceError(404, 'Process not found'))
            .lean()
            .exec();
    }

    // TODO Add search to query
    static searchProcesses(searchBody: { search?: string; ids?: string[]; limit: number; skip: number }) {
        const { ids, limit, skip } = searchBody;
        const query: FilterQuery<IProcessInstance & Document> = {};

        if (ids) {
            query._id = { $in: ids };
        }

        return ProcessInstanceModel.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default ProcessInstanceManager;
