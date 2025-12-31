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

type IRelationShipPrintTreeNode = IMongoRelationshipTemplate & {
    _id: string;
    depth: number;
    destinationEntity: IMongoEntityTemplate;
    sourceEntity: IMongoEntityTemplate;
    children: IRelationShipSelectionTree[];
    entitiesCount: number;
    path: string;
    neoRelIds: string[]; // The relationship ids of the instances (in neo) of each relationship type (that is the mongo id)
};

export type IRelationShipSelectionTree = IRelationShipPrintTreeNode & {
    children: IRelationShipSelectionTree[];
};

export type IPrintingTemplateMap = Map<string, IMongoPrintingTemplate>;
