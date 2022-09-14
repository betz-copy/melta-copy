import { IRule } from './interfaces';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../relationships/interface';
import { IMongoEntityTemplate } from '../entities/interface';
import { generateNeo4jQuery } from '.';

const flightEntityTemplate: IMongoEntityTemplate = {
    _id: '222',
    name: 'flight',
    displayName: 'טיסה',
    category: '222',
    properties: {
        type: 'object',
        properties: {
            flightNumber: {
                type: 'string',
                title: 'מספר טיסה',
            },
            departureDate: {
                type: 'string',
                title: 'תאריך המראה',
                format: 'date-time',
            },
            landingDate: {
                type: 'string',
                title: 'תאריך נחיתה',
                format: 'date-time',
            },
            from: {
                type: 'string',
                title: 'מקום המראה',
            },
            to: {
                type: 'string',
                title: 'מקום הנחיתה',
            },
            planeType: {
                type: 'string',
                title: 'סוג המטוס',
            },
        },
        required: ['flightNumber', 'departureDate', 'landingDate'],
    },
    propertiesOrder: ['flightNumber', 'departureDate', 'landingDate', 'from', 'to', 'planeType'],
    propertiesPreview: ['flightNumber', 'from', 'to'],
    disabled: false,
};

const tripEntityTemplate: IMongoEntityTemplate = {
    _id: '333',
    name: 'trip',
    displayName: 'טיול',
    category: '333',
    properties: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                title: 'שם',
            },
            destination: {
                type: 'string',
                title: 'יעד',
            },
            startDate: {
                type: 'string',
                title: 'תאריך התחלה',
                format: 'date',
            },
            endDate: {
                type: 'string',
                title: 'תאריך סיום',
                format: 'date',
            },
            firstFile: {
                type: 'string',
                title: 'קובץ ראשון',
                format: 'fileId',
            },
        },
        required: ['name', 'destination'],
    },
    propertiesOrder: ['name', 'destination', 'startDate', 'endDate', 'firstFile'],
    propertiesPreview: ['name', 'destination', 'startDate', 'endDate'],
    disabled: false,
};

const tripConnectedToFlightRelationshipTemplatePopulated: IMongoRelationshipTemplatePopulated = {
    _id: '222',
    name: 'flightInTrip',
    displayName: 'טיסה משוייכת לטיול',
    sourceEntity: flightEntityTemplate,
    destinationEntity: tripEntityTemplate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const tripConnectedToFlightRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: tripConnectedToFlightRelationshipTemplatePopulated._id,
    name: tripConnectedToFlightRelationshipTemplatePopulated.name,
    displayName: tripConnectedToFlightRelationshipTemplatePopulated.displayName,
    sourceEntityId: tripConnectedToFlightRelationshipTemplatePopulated.sourceEntity._id,
    destinationEntityId: tripConnectedToFlightRelationshipTemplatePopulated.destinationEntity._id,
    createdAt: tripConnectedToFlightRelationshipTemplatePopulated.createdAt,
    updatedAt: tripConnectedToFlightRelationshipTemplatePopulated.updatedAt,
};

// rule 2
export const noOverlappingFlightsInTrip: IRule = {
    name: 'טיסה אחת ביום לטיול',
    description: 'מקסימום טיסה אחת ביום לאותו הטיול. אסור שיהיו כמה טיסות לאותו הטיול באותו היום כי אחרת זה יהיה ממש מבלבל',
    actionOnFail: 'WARNING',
    relationshipTemplateId: tripConnectedToFlightRelationshipTemplatePopulated._id,
    pinnedEntityTemplateId: tripEntityTemplate._id,
    unpinnedEntityTemplateId: flightEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isAggregationGroup: true,
                aggregation: 'EVERY',
                variableNameOfAggregation: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                ruleOfGroup: 'AND',
                subFormulas: [
                    {
                        isEquation: true,
                        operatorBool: 'notEqual',
                        // todo: make function of: date(dateTimeVariable)
                        lhsArgument: {
                            isPropertyOfVariable: true,
                            variableName: `${tripEntityTemplate._id}.${tripConnectedToFlightRelationshipTemplate._id}.${flightEntityTemplate._id}`,
                            property: 'date',
                        },
                        rhsArgument: { isPropertyOfVariable: true, variableName: 'flight', property: 'date' },
                    },
                ],
            },
        ],
    },
};

// rule 3
export const warnOnEveryFlightOnActiveZone: IRule = {
    name: 'התראה על טיסות בסבב פעיל',
    description: 'התראה על כל טיסה חדשה שמחוברת לסבב פעיל',
    actionOnFail: 'WARNING',
    relationshipTemplateId: tripConnectedToFlightRelationshipTemplatePopulated._id,
    pinnedEntityTemplateId: tripEntityTemplate._id,
    unpinnedEntityTemplateId: flightEntityTemplate._id,
    disabled: false,
    formula: {
        isGroup: true,
        ruleOfGroup: 'AND',
        subFormulas: [
            {
                isEquation: true,
                operatorBool: 'equals',
                lhsArgument: { isPropertyOfVariable: true, variableName: tripEntityTemplate._id, property: 'active' },
                rhsArgument: { isConstant: true, value: false },
            },
        ],
    },
};

export const mainRunExampleRule2 = () => {
    // todo: given to check if rule applies to him
    const pinnedEntityId = '111';
    const nonPinnedEntityId = '222';
    const nonPinnedRelationshipId = '333';

    const neo4jQuery = generateNeo4jQuery(noOverlappingFlightsInTrip, pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, {
        pinnedEntityTemplateId: flightEntityTemplate._id,
        unpinnedEntityTemplateId: tripEntityTemplate._id,
        connectionsTemplates: [{ relationshipTemplate: tripConnectedToFlightRelationshipTemplate, otherEntityTemplate: flightEntityTemplate }],
    });

    return neo4jQuery;
};

export const mainRunExampleRule3 = () => {
    // todo: given to check if rule applies to him
    const pinnedEntityId = '111';
    const nonPinnedEntityId = '222';
    const nonPinnedRelationshipId = '333';

    const neo4jQuery = generateNeo4jQuery(warnOnEveryFlightOnActiveZone, pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, {
        pinnedEntityTemplateId: flightEntityTemplate._id,
        unpinnedEntityTemplateId: tripEntityTemplate._id,
        connectionsTemplates: [{ relationshipTemplate: tripConnectedToFlightRelationshipTemplate, otherEntityTemplate: flightEntityTemplate }],
    });

    return neo4jQuery;
};
