import { Document } from 'mongoose';

export interface IFrame {
    name: string;
    url: string;
    apiToken?: string;
    categoryIds: string[];
    height?: number;
    width?: number;
    placeInSideBar?: boolean;
}

export type IFrameDocument = IFrame & Document;

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}
