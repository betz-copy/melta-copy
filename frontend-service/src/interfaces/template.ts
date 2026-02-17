import { IMongoCategory } from '@packages/category';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { FileDetails } from '@packages/common';
import { IEntity, IEntityExpanded, IUniqueConstraintOfTemplate } from '@packages/entity';
import {
    IEntityTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    IWalletTransfer,
    PropertyExternalWizardType,
    PropertyFormat,
    PropertyType,
} from '@packages/entity-template';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import { IMongoProcessTemplateReviewerPopulated } from '@packages/process';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '@packages/relationship-template';
import { IMongoRule } from '@packages/rule';
import {
    CommonFormInputProperties,
    IFilterTemplate,
    IWalletTransferPopulated,
    PropertyItem,
} from '../common/wizards/entityTemplate/commonInterfaces';

export type ITemplate = IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;

export type IEntityTemplateMap = Map<string, IMongoEntityTemplateWithConstraintsPopulated>;

export type IChildTemplateMap = Map<string, IMongoChildTemplateWithConstraintsPopulated>;

export type IRelationshipTemplateMap = Map<string, IMongoRelationshipTemplate>;

export type IProcessTemplateMap = Map<string, IMongoProcessTemplateReviewerPopulated>;

export type IPrintingTemplateMap = Map<string, IMongoPrintingTemplate>;

export type ICategoryMap = Map<string, IMongoCategory>;

export type IRuleMap = Map<string, IMongoRule>;

export const emptyCategory: IMongoCategory = {
    _id: '',
    displayName: '',
    name: '',
    color: '',
    templatesOrder: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    iconFileId: null,
};

export enum PropertiesTypes {
    properties = 'properties',
    archiveProperties = 'archiveProperties',
    attachmentProperties = 'attachmentProperties',
    detailsProperties = 'detailsProperties',
}

export type PropertyWizardType = keyof typeof PropertyType | keyof typeof PropertyFormat | keyof typeof PropertyExternalWizardType;

export interface EntityTemplateFormInputProperties extends CommonFormInputProperties {
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: IFilterTemplate[];
    };
}

export type EntityTemplatePropertyByType = { type: 'field'; data: EntityTemplateFormInputProperties };

export interface EntityTemplateWizardValues
    extends Omit<
        IEntityTemplateWithConstraintsPopulated,
        | 'properties'
        | 'iconFileId'
        | 'propertiesOrder'
        | 'propertiesPreview'
        | 'enumPropertiesColors'
        | 'uniqueConstraints'
        | 'documentTemplatesIds'
        | 'walletTransfer'
        | '_id'
    > {
    properties: PropertyItem[];
    attachmentProperties: EntityTemplatePropertyByType[];
    archiveProperties: EntityTemplatePropertyByType[];
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    icon?: FileDetails;
    documentTemplatesIds?: File[];
    enumPropertiesColors?: string[];
    walletTransfer?: IWalletTransferPopulated | IWalletTransfer | null;
    _id?: string;
}

export enum Direction {
    to = 'to',
    from = 'from',
    initial = 'initial',
}

export interface WalletTransferData {
    template: IMongoEntityTemplateWithConstraintsPopulated;
    entity: IEntity;
    direction: Direction;
    balanceAtThatTime?: number;
    hasPermissionToRelatedTemplate?: boolean;
}

export interface IWalletTransfers {
    templateId: string;
    expandedEntity: IEntityExpanded;
    connectionsTemplates?: INestedRelationshipTemplates[];
    getButtonStateByRelatedTemplate: (relatedTemplate: IMongoEntityTemplateWithConstraintsPopulated) => {
        isEditButtonsDisabled: boolean;
        disabledButtonText: string;
        hasPermissionToRelatedTemplate: boolean;
    };
}

export interface INestedRelationshipTemplates {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean; // for relationship that is of format currentEntityTemplate -> currentEntityTemplate, we want it twice, once with outgoing connections of expandedEntity, and once with incoming connections of expandedEntity
    hasInstances?: boolean;
    depth: number;
    parentRelationship?: IMongoRelationshipTemplatePopulated;
    children: INestedRelationshipTemplates[];
}
