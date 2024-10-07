export interface IRelationshipTemplate {
  _id: string;
  name: string;
  displayName: string;
  sourceEntityId: string;
  destinationEntityId: string;
  isProperty: boolean;
}
