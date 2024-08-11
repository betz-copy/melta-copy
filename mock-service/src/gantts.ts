import axios from 'axios';
import config from './config';
import { getRandomGantts } from './mocks/gantts/generate';
import { getHardcodedRealGantts } from './mocks/gantts/hardcoded';
import { IMongoEntityTemplate } from './templates/entityTemplates';
import { IMongoRelationshipTemplate } from './templates/relationshipTemplates';
import { trycatch } from './utils';
import { createAxiosInstance } from './utils/axios';

const { url, baseRoute, isAliveRoute } = config.ganttService;

export interface IGanttItem {
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplates: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    }[];
    groupByRelationshipId?: string; // must exist if gantt has groupBy
}

export interface IGantt {
    name: string;
    items: IGanttItem[];
    groupBy?: {
        entityTemplateId: string;
        groupNameField: string; // must be unique
    };
}

export interface IMongoGantt extends IGantt {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}

export const createGantts = (
    chance: Chance.Chance,
    workspaceId: string,
    entityTemplates: IMongoEntityTemplate[],
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
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};
