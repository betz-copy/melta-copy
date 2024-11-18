// eslint-disable-next-line import/no-extraneous-dependencies
import { Chance } from 'chance';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { IMongoEntityTemplatePopulated } from '@microservices/shared';
import { generateMongoId } from './permissions';
import { IGantt, IGanttItem } from '../interfaces/gantts';
import { entityTemplates } from './templates/entityTemplates';
import { pickOneIf, pickRandomSet, pickSetIf, popRandom } from './utils';
import { relationshipTemplates } from './templates/relationshipTemplates';
import { allEntities } from './entities/allEntities';

const chance = new Chance();

const generateGanttItemEntityTemplate = (optionalEntityTemplates: IMongoEntityTemplatePopulated[]): IGanttItem['entityTemplate'] | undefined => {
    while (optionalEntityTemplates.length) {
        const entityTemplate = popRandom(optionalEntityTemplates)!;

        const startAndEndDateFields = pickSetIf(
            Object.entries(entityTemplate.properties.properties),
            2,
            ([_, value]) => value.format === 'date' || value.format === 'date-time',
        );
        // eslint-disable-next-line no-continue
        if (!startAndEndDateFields) continue;

        const [[startDateField], [endDateField]] = startAndEndDateFields;

        return {
            id: entityTemplate._id,
            startDateField,
            endDateField,
            fieldsToShow: pickRandomSet(Object.keys(entityTemplate.properties.properties)),
        };
    }

    return undefined;
};

const generateGanttItemConnectedEntityTemplates = (entityTemplateId: string): IGanttItem['connectedEntityTemplates'] => {
    if (chance.bool()) return []; // 50% chance of not having connected entities

    const connectedEntityTemplates: IGanttItem['connectedEntityTemplates'] = [];

    for (let i = 0; i < chance.integer({ min: 1, max: 5 }); i++) {
        let connectedEntityTemplateId: string | undefined;

        const relationshipTemplate = pickOneIf(relationshipTemplates, (currRelationshipTemplate) => {
            const sourceEntity = allEntities.find((entity) => entity.templateId === currRelationshipTemplate.sourceEntityId);
            const destinationEntity = allEntities.find((entity) => entity.templateId === currRelationshipTemplate.destinationEntityId);

            if (!sourceEntity || !destinationEntity) return false;

            if (sourceEntity.templateId === entityTemplateId) {
                connectedEntityTemplateId = destinationEntity.templateId;
                return true;
            }

            if (destinationEntity.templateId === entityTemplateId) {
                connectedEntityTemplateId = sourceEntity.templateId;
                return true;
            }

            return false;
        });

        const connectedEntityTemplate = entityTemplates.find((entityTemplate) => entityTemplate._id === connectedEntityTemplateId);

        if (!relationshipTemplate || !connectedEntityTemplate) break;

        connectedEntityTemplates.push({
            relationshipTemplateId: relationshipTemplate._id,
            fieldsToShow: pickRandomSet(Object.keys(connectedEntityTemplate.properties.properties)),
        });
    }

    return connectedEntityTemplates;
};

const generateGanttItem = (optionalEntityTemplates: IMongoEntityTemplatePopulated[]): IGanttItem | undefined => {
    const entityTemplate = generateGanttItemEntityTemplate(optionalEntityTemplates);
    if (!entityTemplate) return undefined;

    return {
        entityTemplate,
        connectedEntityTemplates: generateGanttItemConnectedEntityTemplates(entityTemplate.id),
    };
};

const generateGantt = (): IGantt | undefined => {
    const entityTemplatesCopy = [...entityTemplates];
    const items: IGanttItem[] = [];

    for (let i = 0; i < chance.integer({ min: 1, max: 10 }); i++) {
        const ganttItem = generateGanttItem(entityTemplatesCopy);
        if (!ganttItem) break;

        items.push(ganttItem);
    }

    if (!items.length) return undefined;
    const now = new Date();
    return {
        _id: generateMongoId(),
        name: chance.name(),
        items,
        createdAt: now,
        updatedAt: now,
    };
};

const gantts: IGantt[] = [];

for (let i = 0; i < chance.integer({ min: 1, max: 40 }); i++) {
    const gantt = generateGantt();
    if (!gantt) break;

    gantts.push(gantt);
}

export const mockGantts = (mock: MockAdapter) => {
    mock.onGet(/\/api\/gantts\/.*/).reply((data) => {
        const id = data.url?.split('gantts/')[1];
        const gantt = gantts.find((currGantt) => currGantt._id === id);

        if (!gantt) return [StatusCodes.NOT_FOUND];
        return [StatusCodes.OK, gantt];
    });

    mock.onPost('/api/gantts').reply((data) => {
        const newGantt = JSON.parse(data.data);

        gantts.push(newGantt);
        return [StatusCodes.OK, newGantt];
    });

    mock.onPost('/api/gantts/search').reply((data) => {
        const { step = 0, limit = 0 } = JSON.parse(data.data);
        const skip = step * limit;

        return [StatusCodes.OK, gantts.slice(skip, limit + skip)];
    });

    mock.onPut(/\/api\/gantts\/.*/).reply((data) => {
        const id = data.url?.split('gantts/')[1];
        const updatedGantt = JSON.parse(data.data);

        return [StatusCodes.OK, gantts.map((gantt) => (gantt._id === id ? updatedGantt : gantt))];
    });
};
