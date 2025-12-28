import { IMongoChart, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import config from './config';
import { chartsCreator } from './mocks/templateCharts';
import createAxiosInstance from './utils/axios';

const {
    url,
    baseRoute,
    charts: { baseRoute: createChartsBaseRoute },
} = config.dashboardService;

export const createCharts = async (workspaceId: string, entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[], userId: string) => {
    const axios = createAxiosInstance(workspaceId);

    const templateMap = Object.fromEntries(entityTemplates.map(({ name, _id }) => [name, _id]));

    const { travelAgent, flight, tourist, trip, allProperties, phone, creditCard } = templateMap;

    const charts = chartsCreator(travelAgent, tourist, allProperties, trip, flight, phone, creditCard, userId);

    return Promise.all(
        charts.map(async (chart) => {
            const { data } = await axios.post<IMongoChart>(`${url}${baseRoute}${createChartsBaseRoute}`, chart);
            return data;
        }),
    );
};
