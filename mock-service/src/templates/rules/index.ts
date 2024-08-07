import axios from 'axios';
import config from '../../config';
import { IMongoEntityTemplate } from '../entityTemplates';
import { rulesCreator } from '../../mocks/rules';
import { IMongoRelationshipTemplate } from '../relationshipTemplates';
import { IMongoRule } from './interfaces';

const {
    url,
    relationships: { createRuleRoute },
} = config.templateService;

export const createRules = async (entityTemplates: IMongoEntityTemplate[], relationshipTemplates: IMongoRelationshipTemplate[]) => {
    const fliesOnId = relationshipTemplates.find(({ name }) => name === 'fliesOn')!._id;
    const flightInTripId = relationshipTemplates.find(({ name }) => name === 'flightInTrip')!._id;
    const departueFromId = relationshipTemplates.find(({ name }) => name === 'departureFrom')!._id;
    const tripConnectedToAirportId = relationshipTemplates.find(({ name }) => name === 'tripConnectedToAirport')!._id;
    const flightId = entityTemplates.find(({ name }) => name === 'flight')!._id;
    const touristId = entityTemplates.find(({ name }) => name === 'tourist')!._id;
    const tripId = entityTemplates.find(({ name }) => name === 'trip')!._id;
    const airportId = entityTemplates.find(({ name }) => name === 'airport')!._id;

    const rules = rulesCreator(fliesOnId, flightInTripId, departueFromId, tripConnectedToAirportId, flightId, touristId, tripId, airportId);

    const promises = rules.map((rule) => {
        return axios.post<IMongoRule>(url + createRuleRoute, rule);
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};
