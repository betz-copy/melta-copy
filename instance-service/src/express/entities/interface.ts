import { IEntity, ISearchFilter } from '@microservices/shared';

export interface IGetExpandedEntityBody {
    disabled: boolean | null;
    templateIds: string[];
    expandedParams: { [entityId: string]: number };
    filters: { [templateId: string]: { filter?: ISearchFilter; showRelationships: boolean } };
}

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
    properties: Record<string, any>;
}
