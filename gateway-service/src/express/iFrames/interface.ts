import { Document } from 'mongoose';

export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    apiToken?: string;
    iconFileId: string | null;
    placeInSideBar?: boolean;
}

export type IFrameDocument = IFrame & Document;

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}
