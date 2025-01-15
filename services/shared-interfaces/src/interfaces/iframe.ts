export interface IFrame {
    name: string;
    url: string;
    categoryIds: string[];
    iconFileId: string | null;
    placeInSideBar?: boolean;
}

export interface IMongoIFrame extends IFrame {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    skip: number;
    ids?: string[];
}
