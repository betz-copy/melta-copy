export enum StepStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}
export interface IProcessStep {
    properties: Record<string, any>;
    status: StepStatus;
    approverId?: string;
    approvedAt?: Date;
    approvers: string[];
}

export interface IProcessInstance {
    templateId: string;
    details: Record<string, any>;
    steps: IProcessStep[];
}

export interface IMongoProcessInstance extends IProcessInstance {
    _id: string;
}
