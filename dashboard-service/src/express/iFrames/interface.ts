import { Document } from 'mongoose';

export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    iconFileId: string | null;
    placeInSideBar?: boolean;
}

export interface IMongoIframe extends IFrame, Document<string> {
    _id: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    skip: number;
    ids?: string[];
}
