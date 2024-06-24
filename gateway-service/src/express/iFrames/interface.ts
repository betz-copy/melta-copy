import { Document } from 'mongoose';

export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    description?: string;
    apiToken?: string;
    height?: number;
    width?: number;
    icon: object;
    placeInSideBar?: boolean;
}

export type IFrameDocument = IFrame & Document;

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}
