import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IGantt, IGanttItem } from '@packages/gantt';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { pickOneIf, pickRandomSet, pickSetIf, popRandom } from '../../utils/mock';

const generateGanttItemEntityTemplate = (
    chance: Chance.Chance,
    optionalEntityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
): IGanttItem['entityTemplate'] | undefined => {
    while (optionalEntityTemplates.length) {
        const entityTemplate = popRandom(chance, optionalEntityTemplates)!;

        const startAndEndDateFields = pickSetIf(
            chance,
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
            fieldsToShow: pickRandomSet(chance, Object.keys(entityTemplate.properties.properties)),
        };
    }

    return undefined;
};

const generateGanttItemConnectedEntityTemplate = (
    chance: Chance.Chance,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    entityTemplateId: string,
): IGanttItem['connectedEntityTemplates'] => {
    if (chance.bool()) return []; // 50% chance of not having connected entities

    const connectedEntityTemplates: IGanttItem['connectedEntityTemplates'] = [];

    for (let i = 0; i < chance.integer({ min: 1, max: 5 }); i++) {
        let connectedEntityTemplateId: string | undefined;

        const relationshipTemplate = pickOneIf(chance, relationshipTemplates, (currRelationshipTemplate) => {
            if (
                connectedEntityTemplates.find(
                    (connectedEntityTemplate) => connectedEntityTemplate.relationshipTemplateId === currRelationshipTemplate._id,
                )
            )
                return false;

            if (currRelationshipTemplate.sourceEntityId === entityTemplateId) {
                connectedEntityTemplateId = currRelationshipTemplate.destinationEntityId;
                return true;
            }

            if (currRelationshipTemplate.destinationEntityId === entityTemplateId) {
                connectedEntityTemplateId = currRelationshipTemplate.sourceEntityId;
                return true;
            }

            return false;
        });

        const connectedEntityTemplate = entityTemplates.find((entityTemplate) => entityTemplate._id === connectedEntityTemplateId);

        if (!relationshipTemplate || !connectedEntityTemplate) break;

        connectedEntityTemplates.push({
            relationshipTemplateId: relationshipTemplate._id,
            fieldsToShow: pickRandomSet(chance, Object.keys(connectedEntityTemplate.properties.properties)),
        });
    }

    return connectedEntityTemplates;
};

const generateGanttItem = (
    chance: Chance.Chance,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    optionalEntityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
): IGanttItem | undefined => {
    const entityTemplate = generateGanttItemEntityTemplate(chance, optionalEntityTemplates);
    if (!entityTemplate) return undefined;

    return {
        entityTemplate,
        connectedEntityTemplates: generateGanttItemConnectedEntityTemplate(chance, entityTemplates, relationshipTemplates, entityTemplate.id),
    };
};

const generateGantt = (
    chance: Chance.Chance,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
): IGantt | undefined => {
    const entityTemplatesCopy = [...entityTemplates];
    const items: IGanttItem[] = [];

    for (let i = 0; i < chance.integer({ min: 1, max: 10 }); i++) {
        const ganttItem = generateGanttItem(chance, entityTemplates, relationshipTemplates, entityTemplatesCopy);
        if (!ganttItem) break;

        items.push(ganttItem);
    }

    if (!items.length) return undefined;

    return {
        name: chance.name(),
        items,
    };
};

export const getRandomGantts = (
    chance: Chance.Chance,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
    min: number = 1,
    max: number = 40,
): IGantt[] => {
    const gantts: IGantt[] = [];
    for (let i = 0; i < chance.integer({ min, max }); i++) {
        const gantt = generateGantt(chance, entityTemplates, relationshipTemplates);
        if (!gantt) break;

        gantts.push(gantt);
    }

    return gantts;
};
