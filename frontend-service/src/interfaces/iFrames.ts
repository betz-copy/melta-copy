export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    description?: string;
    apiToken?: string;
    iconFileId: string | null;
    placeInSideBar?: boolean;
}
export interface IMongoIFrame extends IFrame {
    values(): Iterable<unknown> | ArrayLike<unknown>;
    _id: string;
    createdAt: string;
    updatedAt: string;
}
export interface ISearchIFramesBody {
    search?: string;
    limit?: number;
    skip?: number;
    ids?: string[];
}

export type IFrameMap = Map<string, IMongoIFrame>;
