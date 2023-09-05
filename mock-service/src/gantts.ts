import axios from 'axios';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';
import { getHardcodedRealGantts, getRandomGantts } from './mocks/gantts';
import { IMongoRelationshipTemplate } from './relationshipTemplates';
import { trycatch } from './utils';

const { uri, baseRoute, isAliveRoute } = config.ganttsService;

export interface IGanttItem {
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplate?: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    };
}

export interface IGantt {
    name: string;
    items: IGanttItem[];
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

export const createGantts = (entityTemplates: IMongoEntityTemplate[], relationshipTemplates: IMongoRelationshipTemplate[]) => {
    const fliesOnId = relationshipTemplates.find(({ name }) => name === 'fliesOn')!._id;
    const flightId = entityTemplates.find(({ name }) => name === 'flight')!._id;
    const tripId = entityTemplates.find(({ name }) => name === 'trip')!._id;

    const hardcodedRealGantts = getHardcodedRealGantts(fliesOnId, flightId, tripId);
    const randomGantts = getRandomGantts();

    const gantts = [...hardcodedRealGantts, ...randomGantts];

    const promises = gantts.map(async (gantt) => {
        const { data: createdGantt } = await axios.post<IMongoGantt>(uri + baseRoute, gantt);
        return createdGantt;
    });

    return Promise.all(promises);
};

export const isGanttsServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(uri + isAliveRoute));

    return { result, err };
};
