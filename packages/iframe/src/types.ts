export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    iconFileId: string | null;
    placeInSideBar?: boolean;
    usedInDashboard?: boolean;
}

import { IMongoProps } from '@packages/common';

export interface IMongoIframe extends IFrame, IMongoProps {}

export interface ISearchIFramesBody {
    search?: string;
    limit?: number;
    skip?: number;
    ids?: string[];
}
