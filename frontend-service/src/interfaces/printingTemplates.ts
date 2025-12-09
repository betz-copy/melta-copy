import { IMongoEntityTemplate } from './entityTemplates';
import { IMongoRelationshipTemplate } from './relationshipTemplates';

export interface IPrintSection {
    categoryId: string;
    entityTemplateId: string;
    selectedColumns: string[];
}

export interface IPrintingTemplate {
    name: string;
    sections: IPrintSection[];
    compactView: boolean;
    addEntityCheckbox: boolean;
    appendSignatureField: boolean;
}

export interface IMongoPrintingTemplate extends IPrintingTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

type ICommonTreeNode = IMongoRelationshipTemplate & {
    _id: string;
    parentId: string;
    depth: number;
    destinationEntity: IMongoEntityTemplate;
    sourceEntity: IMongoEntityTemplate;
    children: ITreeNode[];
    mongoAndRelId: string; // Concatenation of mongo relationship _id and "&" and neo generated id (for unique ui id)
};

export type ITreeNode = ICommonTreeNode & {
    children: ITreeNode[];
};

export type IPrintingTemplateMap = Map<string, IMongoPrintingTemplate>;
