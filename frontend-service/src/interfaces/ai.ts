export enum Step {
    Columns = 'columns',
    Files = 'files',
    Result = 'result',
}

export interface FileOption {
    id: string;
    name: string;
}

export interface AISummaryResponse {
    summary: string;
}
