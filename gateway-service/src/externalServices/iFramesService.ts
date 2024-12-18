import { IFrame } from '../express/iFrames/interface';

export interface IMongoIFrame extends IFrame {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    skip: number;
    ids?: string[];
}

export { IFrame };
