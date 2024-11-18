import { Document } from "mongoose";
import { IMongoEntityTemplatePopulated, ISearchBody } from "./entityTemplate";

export interface IRelationshipTemplate {
  name: string;
  displayName: string;
  sourceEntityId: string;
  destinationEntityId: string;
  isProperty: boolean;
}

export interface IMongoRelationshipTemplate
  extends IRelationshipTemplate,
    Document<string> {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type IMongoRelationshipTemplatePopulated = Omit<
  IMongoRelationshipTemplate,
  "sourceEntityId" | "destinationEntityId"
> & {
  sourceEntity: IMongoEntityTemplatePopulated;
  destinationEntity: IMongoEntityTemplatePopulated;
};

export interface ISearchRelationshipTemplatesBody extends ISearchBody {
  ids?: string[];
  sourceEntityIds?: string[];
  destinationEntityIds?: string[];
}

export type IRelationshipTemplateMap = Map<string, IMongoRelationshipTemplate>;
