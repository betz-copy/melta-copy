import axios from '../axios';
import { environment } from '../globals';
import { IRelationship } from '../interfaces/relationships';

const { relationships } = environment.api;

const createRelationshipRequest = async (
    relationship: Omit<IRelationship, 'properties'> & { properties: Omit<IRelationship['properties'], '_id'> },
) => {
    const { data } = await axios.post<IRelationship>(relationships, relationship);
    return data;
};

const deleteRelationshipRequest = async (relationshipId: string) => {
    const { data } = await axios.delete<IRelationship>(`${relationships}/${relationshipId}`);
    return data;
};

export { createRelationshipRequest, deleteRelationshipRequest };
