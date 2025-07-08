// import { IMongoCategory } from './category';
// import { IUniqueConstraintOfTemplate } from './entity';
// import {
//     IEntityTemplate,
//     IMongoEntityTemplate,
//     IFullMongoEntityTemplate,
//     IEntityTemplatePopulated,
//     IMongoEntityTemplatePopulated,
//     IEntityTemplateWithConstraints,
//     IMongoEntityTemplateWithConstraints,
//     IEntityTemplateWithConstraintsPopulated,
//     IMongoEntityTemplateWithConstraintsPopulated,
//     WithConstraints,
// } from './entityTemplate';
// import { IChildTemplate, IMongoChildTemplate, IEntityChildTemplatePopulated, ViewType } from './entityChildTemplate';

// export interface IUnifiedTemplate {
//     name: string;
//     displayName: string;
//     description: string;
//     fatherTemplateId: string;
//     categories: IMongoCategory['_id'][];
//     properties: Record<string, unknown>;
//     disabled: boolean;
//     actions?: string;
//     viewType: ViewType;
//     isFilterByCurrentUser: boolean;
//     isFilterByUserUnit: boolean;
//     filterByCurrentUserField?: string;
// }

// export interface IMongoUnifiedTemplate extends IUnifiedTemplate, Document<string> {
//     _id: string;
// }

// export interface IEntityUnifiedTemplatePopulatedFromDb extends Omit<IMongoUnifiedTemplate, 'categories' | 'fatherTemplateId'> {
//     fatherTemplateId: IFullMongoEntityTemplate;
//     categories: IMongoCategory[];
// }

// export interface ISearchEntityUnifiedTemplatesBody extends ISearchBody {
//     ids?: string[];
//     categoryIds?: string[];
//     fatherTemplatesIds?: string[];
// }

// // When populating child, it will ask the parent for all of its properties.
// export interface IEntityUnifiedTemplatePopulated
//     extends Omit<IMongoEntityTemplate, 'properties' | 'category'>,
//         Omit<IEntityUnifiedTemplatePopulatedFromDb, 'properties'> {
//     properties: Omit<IProperties, 'properties'> & {
//         properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
//     };
// }

// export interface IEntityUnifiedTemplateWithFather extends Omit<IMongoEntityTemplate, 'properties' | 'category'>, Omit<IChildTemplate, 'properties'> {
//     properties: Omit<IProperties, 'properties'> & {
//         properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
//     };
// }

// export type IUnifiedTemplateWithConstraints<T extends 'parent' | 'child' = 'parent'> = T extends 'parent'
//     ? IEntityTemplateWithConstraints
//     : WithConstraints<IEntityChildTemplatePopulated>;

// export type IMongoUnifiedTemplateWithConstraints<T extends 'parent' | 'child' = 'parent'> = T extends 'parent'
//     ? IMongoEntityTemplateWithConstraints
//     : WithConstraints<IEntityChildTemplatePopulated> & { _id: string };

// export type IUnifiedTemplateWithConstraintsPopulated<T extends 'parent' | 'child' = 'parent'> = T extends 'parent'
//     ? IEntityTemplateWithConstraintsPopulated
//     : WithConstraints<IEntityChildTemplatePopulated>;

// export type IMongoUnifiedTemplateWithConstraintsPopulated<T extends 'parent' | 'child' = 'parent'> = T extends 'parent'
//     ? IMongoEntityTemplateWithConstraintsPopulated
//     : WithConstraints<IEntityChildTemplatePopulated> & { _id: string; createdAt: Date; updatedAt: Date };
