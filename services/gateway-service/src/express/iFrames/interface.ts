export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    iconFileId: string | null;
    placeInSideBar?: boolean;
}

export interface IFrameDocument extends IFrame {
    _id: string;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}
