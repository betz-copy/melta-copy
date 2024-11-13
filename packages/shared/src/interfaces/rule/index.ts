import { IEntityTemplatePopulated } from "../entityTemplate";
import { IMongoRelationshipTemplate } from "../relationshipTemplate";
import { IFormula } from "./formula";

export interface IRule {
  name: string;
  description: string;
  actionOnFail: "WARNING" | "ENFORCEMENT";
  entityTemplateId: string;
  formula: IFormula;
  disabled: boolean;
}

export interface IMongoRule extends IRule {
  _id: string;
}

export interface ISearchRulesBody {
  search?: string;
  entityTemplateIds?: string[];
  disabled?: boolean;
  limit?: number;
  skip?: number;
}

export interface IRelevantTemplates {
  entityTemplate: IEntityTemplatePopulated;
  connectionsTemplatesOfEntityTemplate: Array<{
    relationshipTemplate: IMongoRelationshipTemplate;
    otherEntityTemplate: IEntityTemplatePopulated;
  }>;
}
