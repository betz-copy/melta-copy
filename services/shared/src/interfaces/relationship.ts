import { IEntity } from "./entity";

/* eslint-disable no-shadow */
export interface IRelationship {
  templateId: string;
  properties: Record<string, any>;
  sourceEntityId: string;
  destinationEntityId: string;
}

export interface IRelationshipPopulated {
  templateId: string;
  properties: Record<string, any>;
  sourceEntity: IEntity;
  destinationEntity: IEntity;
}
