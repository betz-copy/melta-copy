export interface INotification {
    viewers: string[];
    type: string;
    metadata: object;
    createdAt: Date;
}

export type IBasicNotification = Omit<INotification, 'viewers'>;
