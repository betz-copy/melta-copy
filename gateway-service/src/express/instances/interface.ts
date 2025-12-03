export enum ExternalIdType {
    chart = 'chart',
    dashboard = 'dashboard',
}

export interface IExternalId {
    id: string;
    type: ExternalIdType;
}
