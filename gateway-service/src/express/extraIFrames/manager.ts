// import lodashIsEqual from 'lodash.isequal';
import axios from 'axios';
import { IMongoEntityTemplatePopulated } from '../../externalServices/entityTemplateService';
import { IFrame, IFramesService, IMongoIFrame, ISearchIFramesBody } from '../../externalServices/iFramesService';
// import { InstanceManagerService } from '../../externalServices/instanceService';
// import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateService';
// import { ServiceError } from '../error';
import { getAllowedCategoriesForInstances } from '../instances/middlewares';
import { IPermissionsOfUser } from '../permissions/interfaces';


export class IFrameManager {
    private static filterIFrameWithPermissions(iFrame: IMongoIFrame, allowedEntityTemplates: IMongoEntityTemplatePopulated[]) {
        const filteredIFrame = iFrame.categoryIds.filter((id) => {
            return allowedEntityTemplates.some(({ _id }) => _id === id);
        });
        console.log({ filteredIFrame });

        return filteredIFrame;
    }

    static async getExternalSiteById(req, res, next) {
        const iFrame: IFrame = await this.getIFrameById(req.params.iFrameId);
        const IFramesManagerProxy = createProxyMiddleware({
            target: iFrame.url,
            changeOrigin: true,
            onProxyReq: (proxyReq, _req, _res) => {
                // proxyReq.setHeader('Authorization', `Bearer ${iFrame.apiToken}`);
                proxyReq.setHeader('Content-Type', 'application/json');
            },
            proxyTimeout: 1000,
        });
        IFramesManagerProxy(req, res, next);
    }

    static async searchIFrames(searchBody: ISearchIFramesBody, _permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        // const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(permissionsOfUserId);

        // const iFrames = await IFramesService.searchIFrames(searchBody);
        // return iFrames.map((iFrame) => this.filterIFrameWithPermissions(iFrame, allowedEntityTemplates));
        return IFramesService.searchIFrames(searchBody);
    }

    static async getIFrameById(iFrameId: string, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedEntityTemplates = await getAllowedCategoriesForInstances(permissionsOfUserId);

        const iFrame = await IFramesService.getIFrameById(iFrameId);
        // return this.filterIFrameWithPermissions(iFrame, allowedEntityTemplates);
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

    static async createIFrame(iframe: IFrame) {
        // await this.validateTemplatesDataOfIFrame(iframe);
        return IFramesService.createIFrame(iframe);
    }

    static deleteIFrame(iframeId: string) {
        return IFramesService.deleteIFrame(iframeId);
    }

    static async updateIFrame(iframeId: string, iframe: IFrame) {
        // await this.validateTemplatesDataOfIFrame(iframe);
        return IFramesService.updateIFrame(iframeId, iframe);
    }
}

export default IFrameManager;
