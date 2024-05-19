interface IAutoAction {
    codeAST: any;
    code: string;
}
export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
    action?: IAutoAction;
}

export interface IMongoRelationshipTemplate extends IRelationshipTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
