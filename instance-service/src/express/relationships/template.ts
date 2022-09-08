import axios from 'axios';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';
import { IMongoRelationshipTemplate } from './interface';
import config from '../../config';

const { relationshipManager } = config;
const { url, getRelationshipByIdRoute, timeout } = relationshipManager;

export const getRelationshipTemplateById = async (templateId: string) => {
    const { result, err } = await trycatch(() =>
        axios.get<IMongoRelationshipTemplate>(`${url}${getRelationshipByIdRoute}/${templateId}`, { timeout }),
    );

    if (err || !result) {
        throw new ValidationError(`Failed to fetch relationship template schema (id: ${templateId})`);
    }

    return result.data;
};
