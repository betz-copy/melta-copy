import RedisClient from '.';
import config from '../../config';

const { redis } = config;

export const getLatestGlobalSearchIndex = async () => {
    const redisClient = RedisClient.getClient();

    return redisClient.get(redis.globalSearchKeyName);
};

export const getLatestTemplateSearchIndex = async (templateId: string) => {
    const redisClient = RedisClient.getClient();

    return redisClient.get(`${redis.templateSearchKeyNamePrefix}${templateId}`);
};
