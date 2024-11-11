export interface IAgGridRequest {
    startRow: number;
    endRow: number;
    filterModel: Record<string, object>;
    sortModel: object[];
}

export interface IAgGridResult<T> {
    rows: T[];
    lastRowIndex: number;
}
