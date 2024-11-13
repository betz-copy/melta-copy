import { Document } from "mongoose";
import { ISearchBody } from "./entityTemplate";

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
}

export interface ISearchRelationshipTemplatesBody extends ISearchBody {
  ids?: string[];
  sourceEntityIds?: string[];
  destinationEntityIds?: string[];
}
