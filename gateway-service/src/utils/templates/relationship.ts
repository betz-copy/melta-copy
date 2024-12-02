import { StatusCodes } from 'http-status-codes';
import { BadRequestError, ServiceError } from '../../express/error';
import { IConstraintsOfTemplate } from '../../externalServices/instanceService/interfaces/entities';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IMongoRule } from '../../express/templates/rules/interfaces';
import config from '../../config';
import { IEntitySingleProperty } from '../../externalServices/templates/entityTemplateService';

const { relationshipTemplateHasRules, moreThenOneRelationshipInstanceExist } = config.errorCodes;

const validateRequiredConstraints = (requiredConstraints: IConstraintsOfTemplate['requiredConstraints']) => {
    if (!requiredConstraints.length) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, 'There are no required fields for the destination entity');
    }
};

const validateUniqueRelationships = (existingRelationships: IRelationship[]) => {
    const sourceEntityIdsMap = new Set<string>();

    existingRelationships.forEach((relationship) => {
        if (sourceEntityIdsMap.has(relationship.sourceEntityId)) {
            throw new BadRequestError('Some entities have more than one relationship', {
                errorCode: moreThenOneRelationshipInstanceExist,
            });
        }
        sourceEntityIdsMap.add(relationship.sourceEntityId);
    });
};

const validateNoDependentRules = (rules: IMongoRule[]) => {
    if (rules.length) {
        throw new BadRequestError('There are rules attached to this relationship', {
            errorCode: relationshipTemplateHasRules,
        });
    }
};

const buildNewRelationshipField = (
    displayFieldName: string,
    relationshipTemplateId: string,
    relationshipTemplateDirection: 'outgoing' | 'incoming',
    relatedTemplateId: string,
    relatedTemplateField: string,
): IEntitySingleProperty => {
    return {
        title: displayFieldName,
        type: 'string',
        format: 'relationshipReference',
        relationshipReference: {
            relationshipTemplateId,
            relationshipTemplateDirection,
            relatedTemplateId,
            relatedTemplateField,
        },
    };
};

export { validateNoDependentRules, validateRequiredConstraints, validateUniqueRelationships, buildNewRelationshipField };
