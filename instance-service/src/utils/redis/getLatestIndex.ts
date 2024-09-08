import RedisClient from '.';
import config from '../../config';

const { redis } = config;

export const getLatestGlobalSearchIndex = async (workspaceId: string) => {
    const redisClient = new RedisClient(workspaceId);

    return redisClient.get(redis.globalSearchKeyName);
};

export const getLatestTemplateSearchIndex = async (workspaceId: string, templateId: string) => {
    const redisClient = new RedisClient(workspaceId);

    return redisClient.get(`${redis.templateSearchKeyNamePrefix}${templateId}`);
};
