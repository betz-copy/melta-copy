import { IRelationship, IRuleBreach } from '@microservices/shared';
import axios from '../axios';
import { environment } from '../globals';

const { relationships } = environment.api;

const createRelationshipRequest = async (requestBody: {
    relationshipInstance: Omit<IRelationship, 'properties'> & { properties: Omit<IRelationship['properties'], '_id'> };
    ignoredRules?: IRuleBreach['brokenRules'];
}) => {
    const { data } = await axios.post<IRelationship>(relationships, requestBody);
    return data;
};

const deleteRelationshipRequest = async (
    relationshipId: string,
    requestBody: {
        ignoredRules?: IRuleBreach['brokenRules'];
    } = {},
) => {
    const { data } = await axios.delete<IRelationship>(`${relationships}/${relationshipId}`, { data: requestBody });
    return data;
};

export { createRelationshipRequest, deleteRelationshipRequest };
