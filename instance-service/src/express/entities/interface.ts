import { IEntity, IMongoEntityTemplate, IMongoRelationshipTemplate, ISearchFilter } from '@microservices/shared';

export interface IGetExpandedEntityBody {
    templateIds: string[];
    expandedParams: Record<string, { minLevel?: number; maxLevel: number }>;
    filters: { [templateId: string]: { filter?: ISearchFilter; showRelationships: boolean } };

    relationshipIds?: string[];
}

export type IRelationShipTreeNode = IMongoRelationshipTemplate & {
    _id: string;
    depth: number;
    destinationEntity: IMongoEntityTemplate;
    sourceEntity: IMongoEntityTemplate;
    entitiesCount: number;
    neoRelIds: string[];
    children: IRelationShipTreeNode[];
    path: string;
};

export type ITreeNodeMap = Map<string, { _id: string; children: ITreeNodeMap; neoRelIds: Set<string> }>;

export type IEntityTreeNode = IEntity & { children: (IEntityTreeNode & { relationshipId: string })[] };

export const isRelationshipReference = (object: any): object is IEntity => {
    return (
        typeof object === 'object' &&
        'properties' in object &&
        typeof object.properties === 'object' &&
        'templateId' in object &&
        typeof object.templateId === 'string'
    );
};

export enum RunRuleReason {
    dependentViaAggregation = 'dependentViaAggregation',
    dependentOnEntity = 'dependentOnEntity',
}

// reasons which rules to run on each entity
// entityId -> reasons[], entityTemplateId
export type EntitiesIdsRulesReasonsMap = Map<
    string,
    {
        reasons: (
            | {
                  type: RunRuleReason.dependentViaAggregation;
                  dependentRelationshipTemplateId: string;
                  updatedProperties?: string[] | undefined;
              }
            | {
                  type: RunRuleReason.dependentOnEntity;
                  updatedProperties?: string[] | undefined;
              }
        )[];
        entityTemplateId: string;
    }
>;

export enum IEntityCrudAction {
    onCreateEntity = 'onCreateEntity',
    onUpdateEntity = 'onUpdateEntity',
}

export interface IExecutionOutput {
    entityId: string;
    properties: IEntity['properties']; // [propertyName]: new/prev value
}
