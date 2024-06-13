import { FilterQuery } from 'mongoose';
import { IFrame, IFramesService, ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrameDocument } from './interface';
import { IPermissionsOfUser } from '../permissions/interfaces';

export class IFrameManager {
    // private static filterIFrameWithPermissions(iFrame: IMongoIFrame, allowedEntityTemplates: IMongoEntityTemplatePopulated[]) {
    //     const filteredIFrame = iFrame.categoryIds.filter((id) => {
    //         return allowedEntityTemplates.some(({ _id }) => _id === id);
    //     });
    //     console.log({ filteredIFrame });

    //     return filteredIFrame;
    // }

    static escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    static searchIFrames({ search, limit, step }: ISearchIFramesBody, _permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        // const allowedEntityTemplates = await getAllowedCategoriesForInstances(permissionsOfUserId);

        const query: FilterQuery<IFrameDocument> = {};

        if (search) {
            query.name = { $regex: this.escapeRegExp(search) };
        }

        const iFrames = IFrameModel.find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
        // return iFrames.map((gantt) => this.filterIFramesWithPermissions(gantt, allowedEntityTemplates));
        return iFrames;
    }

    static getIFrameById(iframeId: string) {
        return IFrameModel.findById(iframeId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async getExternalSiteById(iFrameId: string) {
        // אוטנטיקציות של באק

        const iFrame = await this.getIFrameById(iFrameId);
        return IFramesService.getExternalSiteById(iFrame);
    }

    static async createIFrame(iframe: IFrame) {
        return IFrameModel.create(iframe);
    }

    static deleteIFrame(iframeId: string) {
        return IFrameModel.findByIdAndDelete(iframeId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async updateIFrame(iframeId: string, iframe: IFrame) {
        return IFrameModel.findByIdAndUpdate(iframeId, iframe, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'IFrame not found'))
            .lean()
            .exec();
    }

    // private static doesRelationshipContainsEntityTemplate(
    //     relationshipTemplateId: string,
    //     relationshipTemplatesMap: Map<string, IRelationshipTemplate>,
    //     entityTemplateId: string,
    // ) {
    //     const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);
    //     if (!relationshipTemplate) {
    //         throw new ServiceError(400, `iFrame contains unknown relationship template id "${relationshipTemplateId}"`);
    //     }

    //     const doesEntityTemplateInRelationshipTemplate =
    //         relationshipTemplate.sourceEntityId === entityTemplateId || relationshipTemplate.destinationEntityId === entityTemplateId;

    //     if (!doesEntityTemplateInRelationshipTemplate) {
    //         throw new ServiceError(
    //             400,
    //             `iFrame contains relationship template id "${relationshipTemplateId}" which doesnt contain entity template "${entityTemplateId}" as source/destination`,
    //         );
    //     }
    // }

    // private static async validateIFrameGroupBy(iFrame: IFrame, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
    //     if (!iFrame.groupBy) {
    //         if (iFrame.items.some(({ groupByRelationshipId }) => groupByRelationshipId)) {
    //             throw new ServiceError(400, 'iFrame contains items with "groupByRelationshipId" without having "groupBy"');
    //         }
    //         return;
    //     }

    //     const groupByEntityTemplateConstraints = await InstanceManagerService.getConstraintsOfTemplate(iFrame.groupBy.entityTemplateId);
    //     if (
    //         !groupByEntityTemplateConstraints.uniqueConstraints.find((uniqueConstraint) =>
    //             lodashIsEqual(uniqueConstraint, [iFrame.groupBy!.groupNameField]),
    //         )
    //     ) {
    //         throw new ServiceError(
    //             400,
    //             `iFrame contains groupBy with groupNameField "${iFrame.groupBy.groupNameField}" which is not unique under entity template id "${iFrame.groupBy.entityTemplateId}"`,
    //         );
    //     }

    //     iFrame.items.forEach(({ groupByRelationshipId }) => {
    //         if (!groupByRelationshipId) {
    //             throw new ServiceError(400, 'iFame contains items without "groupByRelationshipId" while having "groupBy"');
    //         }

    //         IFrameManager.doesRelationshipContainsEntityTemplate(groupByRelationshipId, relationshipTemplatesMap, iFrame.groupBy!.entityTemplateId);
    //     });
    // }

    // private static validateEntityTemplateOfIFrameItem(iframeItem: IFrameItem, entityTemplatesMap: Map<string, IMongoEntityTemplatePopulated>) {
    //     const {
    //         entityTemplate: { id: entityTemplateId, startDateField, endDateField, fieldsToShow },
    //     } = iframeItem;

    //     const entityTemplate = entityTemplatesMap.get(entityTemplateId);
    //     if (!entityTemplate) {
    //         throw new ServiceError(400, `iframe contains unknown entity template id "${entityTemplateId}"`);
    //     }

    //     [startDateField, endDateField, ...fieldsToShow].forEach((field) => {
    //         if (!entityTemplate.propertiesOrder.includes(field)) {
    //             throw new ServiceError(
    //                 400,
    //                 `iframe contains unknown field "${field}" under iframe item with entity template id "${entityTemplate._id}"`,
    //             );
    //         }
    //     });
    // }

    // private static validateRelationshipOfIFrameItem(iframeItem: IFrameItem, relationshipTemplatesMap: Map<string, IRelationshipTemplate>) {
    //     const {
    //         entityTemplate: { id: entityTemplateId },
    //         connectedEntityTemplates,
    //     } = iframeItem;

    //     connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
    //         IFrameManager.doesRelationshipContainsEntityTemplate(relationshipTemplateId, relationshipTemplatesMap, entityTemplateId);
    //     });
    // }

    // private static validateConnectedEntityOfIFrameItem(
    //     iframeItem: IFrameItem,
    //     allEntityTemplates: Map<string, IMongoEntityTemplatePopulated>,
    //     relationshipTemplatesMap: Map<string, IRelationshipTemplate>,
    // ) {
    //     const {
    //         entityTemplate: { id: entityTemplateId },
    //         connectedEntityTemplates,
    //     } = iframeItem;

    //     connectedEntityTemplates.forEach(({ relationshipTemplateId, fieldsToShow }) => {
    //         const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);
    //         if (!relationshipTemplate) {
    //             throw new ServiceError(400, `iframe contains unknown relationship template id "${relationshipTemplateId}"`);
    //         }

    //         const otherEntityTemplateId =
    //             relationshipTemplate.sourceEntityId === entityTemplateId
    //                 ? relationshipTemplate.destinationEntityId
    //                 : relationshipTemplate.sourceEntityId;
    //         const otherEntityTemplate = allEntityTemplates.get(otherEntityTemplateId)!;

    //         fieldsToShow.forEach((field) => {
    //             if (!otherEntityTemplate.propertiesOrder.includes(field)) {
    //                 throw new ServiceError(
    //                     400,
    //                     `iframe contains unknown field "${field}" under entity template id "${otherEntityTemplateId}" which is connectedEntity of iframe item of entity template id "${entityTemplateId}"`,
    //                 );
    //             }
    //         });
    //     });
    // }

    // private static async validateTemplatesDataOfIFrame(iframe: IFrame) {
    //     const entityTemplateIdsOfItems = iframe.items.map(({ entityTemplate: { id } }) => id);
    //     if (iframe.groupBy) entityTemplateIdsOfItems.push(iframe.groupBy.entityTemplateId);

    //     const entityTemplateIds = [...new Set(entityTemplateIdsOfItems)];
    //     const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: entityTemplateIds });
    //     const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

    //     iframe.items.forEach((iframeItem) => {
    //         IFrameManager.validateEntityTemplateOfIFrameItem(iframeItem, entityTemplatesMap);
    //     });

    //     const relationshipTemplateIdsOfItems = iframe.items.reduce<string[]>(
    //         (relationshipIds, { connectedEntityTemplates, groupByRelationshipId }) => {
    //             connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
    //                 relationshipIds.push(relationshipTemplateId);
    //             });

    //             if (groupByRelationshipId) relationshipIds.push(groupByRelationshipId);

    //             return relationshipIds;
    //         },
    //         [],
    //     );

    //     const relationshipTemplateIds = [...new Set(relationshipTemplateIdsOfItems)];
    //     const relationshipTemplates = await RelationshipsTemplateManagerService.searchRelationshipTemplates({ ids: relationshipTemplateIds });
    //     const relationshipTemplatesMap = new Map(
    //         relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
    //     );

    //     iframe.items.forEach((iframeItem) => {
    //         IFrameManager.validateRelationshipOfIFrameItem(iframeItem, relationshipTemplatesMap);
    //     });
    //     await IFrameManager.validateIFrameGroupBy(iframe, relationshipTemplatesMap);

    //     const additionalEntityTemplateIdsFromRelationshipsOfItems: string[] = [];
    //     iframe.items.forEach(({ entityTemplate: { id: entityTemplateId }, connectedEntityTemplates }) => {
    //         connectedEntityTemplates.forEach(({ relationshipTemplateId }) => {
    //             const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId)!;

    //             const otherEntityTemplateId =
    //                 relationshipTemplate.sourceEntityId === entityTemplateId
    //                     ? relationshipTemplate.destinationEntityId
    //                     : relationshipTemplate.sourceEntityId;

    //             // it might already exists because of another item
    //             if (!entityTemplatesMap.has(otherEntityTemplateId)) {
    //                 additionalEntityTemplateIdsFromRelationshipsOfItems.push(otherEntityTemplateId);
    //             }
    //         });
    //     });
    //     const additionalEntityTemplateIds = [...new Set(additionalEntityTemplateIdsFromRelationshipsOfItems)];

    //     const additionalEntityTemplates = await EntityTemplateManagerService.searchEntityTemplates({
    //         ids: additionalEntityTemplateIds,
    //     });
    //     const additionalEntityTemplatesEntries: Array<[string, IMongoEntityTemplatePopulated]> = additionalEntityTemplates.map((entityTemplate) => [
    //         entityTemplate._id,
    //         entityTemplate,
    //     ]);

    //     const allEntityTemplates = new Map([...entityTemplatesMap, ...additionalEntityTemplatesEntries]);

    //     iframe.items.forEach((iframeItem) => {
    //         IFrameManager.validateConnectedEntityOfIFrameItem(iframeItem, allEntityTemplates, relationshipTemplatesMap);
    //     });
    // }
}

export default IFrameManager;
