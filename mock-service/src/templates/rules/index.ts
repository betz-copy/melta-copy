import { IMongoEntityTemplateWithConstraintsPopulated, IMongoRelationshipTemplate, IMongoRule } from '@microservices/shared';
import config from '../../config';
import rulesCreator from '../../mocks/rules';
import createAxiosInstance from '../../utils/axios';

const {
    url,
    relationships: { createRuleRoute },
} = config.templateService;

export const createRules = async (
    workspaceId: string,
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    relationshipTemplates: IMongoRelationshipTemplate[],
) => {
    const axios = createAxiosInstance(workspaceId);

    const fliesOnId = relationshipTemplates.find(({ name }) => name === 'fliesOn')!._id;
    const flightInTripId = relationshipTemplates.find(({ name }) => name === 'flightInTrip')!._id;
    const departueFromId = relationshipTemplates.find(({ name }) => name === 'departureFrom')!._id;
    const tripConnectedToAirportId = relationshipTemplates.find(({ name }) => name === 'tripConnectedToAirport')!._id;
    const flightId = entityTemplates.find(({ name }) => name === 'flight')!._id;
    const touristId = entityTemplates.find(({ name }) => name === 'tourist')!._id;
    const tripId = entityTemplates.find(({ name }) => name === 'trip')!._id;
    const airportId = entityTemplates.find(({ name }) => name === 'airport')!._id;

    const rules = rulesCreator(fliesOnId, flightInTripId, departueFromId, tripConnectedToAirportId, flightId, touristId, tripId, airportId);

    return Promise.all(
        rules.map(async (rule) => {
            const { data } = await axios.post<IMongoRule>(url + createRuleRoute, rule);
            return data;
        }),
    );
};
