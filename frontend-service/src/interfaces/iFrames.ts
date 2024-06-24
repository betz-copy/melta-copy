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

export interface ISearchIFramesBody {
    search?: string;
    limit: number;
    step: number;
}
