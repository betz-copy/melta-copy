export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: object;
    disabled: boolean;
    iconFileId: string | null;
}
