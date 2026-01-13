import { IMongoEntityTemplateWithConstraintsPopulated, IMongoGantt, IMongoRelationshipTemplate } from '@microservices/shared';
import axios from 'axios';
import config from './config';
import { getRandomGantts } from './mocks/gantts/generate';
import getHardcodedRealGantts from './mocks/gantts/hardcoded';
import { tryCatch } from './utils';
import createAxiosInstance from './utils/axios';

const { url, baseRoute, isAliveRoute } = config.ganttService;

export const createGantts = (
    chance: Chance.Chance,
    workspaceId: string,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const fliesOnId = relationshipTemplates.find(({ name }) => name === 'fliesOn')!._id;
    const flightId = entityTemplates.find(({ name }) => name === 'flight')!._id;
    const tripId = entityTemplates.find(({ name }) => name === 'trip')!._id;

    const hardcodedRealGantts = getHardcodedRealGantts(fliesOnId, flightId, tripId);
    const randomGantts = getRandomGantts(chance, entityTemplates, relationshipTemplates);

    const gantts = [...hardcodedRealGantts, ...randomGantts];

    const promises = gantts.map(async (gantt) => {
        const { data: createdGantt } = await axiosInstance.post<IMongoGantt>(url + baseRoute, gantt);
        return createdGantt;
    });

    return Promise.all(promises);
};

export const isGanttsServiceAlive = async () => {
    const { result, err } = await tryCatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
