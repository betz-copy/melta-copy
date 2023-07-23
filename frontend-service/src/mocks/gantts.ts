import { Chance } from 'chance';
import MockAdapter from 'axios-mock-adapter/types';
import { generateMongoId } from './permissions';
import { IGantt, IGanttItem } from '../interfaces/gantts';
import { entityTemplates } from './templates/entityTemplates';
import { pickOneIf, pickRandomSet, pickSetIf, popRandom } from './utils';
import { relationshipTemplates } from './templates/relationshipTemplates';
import { allEntities } from './entities/allEntities';
import { IMongoRelationshipTemplate } from '../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

const chance = new Chance();

const generateGanttItemEntityTemplate = (optionalEntityTemplates: IMongoEntityTemplatePopulated[]): IGanttItem['entityTemplate'] | undefined => {
    while (optionalEntityTemplates.length) {
        const entityTemplate = popRandom(optionalEntityTemplates)!;

        const startAndEndDateFields = pickSetIf(
            Object.entries(entityTemplate.properties.properties),
            2,
            ([_, value]) => value.format === 'date' || value.format === 'date-time',
        );
        if (!startAndEndDateFields) continue;

        const [[startDateField], [endDateField]] = startAndEndDateFields;

        return {
            id: entityTemplate._id,
            startDateField,
            endDateField,
            fieldsToShow: pickRandomSet(Object.keys(entityTemplate.properties.properties)),
        };
    }

    // ts warning: not all code paths return a value
};

const generateGanttItemConnectedEntityTemplate = (entityTemplateId: string): IGanttItem['connectedEntityTemplate'] | undefined => {
    let connectedEntityTemplateId: string | undefined;
    let relationshipTemplate: IMongoRelationshipTemplate | undefined;

    if (chance.bool()) return; // 50% chance of not having a connected entity

    relationshipTemplate = pickOneIf(relationshipTemplates, (relationshipTemplate) => {
        const sourceEntity = allEntities.find((entity) => entity.templateId === relationshipTemplate.sourceEntityId);
        const destinationEntity = allEntities.find((entity) => entity.templateId === relationshipTemplate.destinationEntityId);

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

    if (!relationshipTemplate || !connectedEntityTemplate) return;

    return {
        relationshipTemplateId: relationshipTemplate._id,
        fieldsToShow: pickRandomSet(Object.keys(connectedEntityTemplate.properties.properties)),
    };
};

const generateGanttItem = (optionalEntityTemplates: IMongoEntityTemplatePopulated[]): IGanttItem | undefined => {
    const entityTemplate = generateGanttItemEntityTemplate(optionalEntityTemplates);
    if (!entityTemplate) return;

    return {
        _id: generateMongoId(),
        entityTemplate,
        connectedEntityTemplate: generateGanttItemConnectedEntityTemplate(entityTemplate.id),
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

    if (!items.length) return;

    return {
        _id: generateMongoId(),
        name: chance.name(),
        items,
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
        const gantt = gantts.find((gantt) => gantt._id === id);

        if (!gantt) return [404];
        return [200, gantt];
    });

    mock.onPost('/api/gantts').reply((data) => {
        const newGantt = JSON.parse(data.data);

        gantts.push(newGantt);
        return [200, newGantt];
    });

    mock.onPost('/api/gantts/search').reply((data) => {
        const { step = 0, limit = 0 } = JSON.parse(data.data);
        const skip = step * limit;

        return [200, gantts.slice(skip, limit + skip)];
    });

    mock.onPut(/\/api\/gantts\/.*/).reply((data) => {
        const id = data.url?.split('gantts/')[1];
        const updatedGantt = JSON.parse(data.data);

        return [200, gantts.map((gantt) => (gantt._id === id ? updatedGantt : gantt))];
    });
};
