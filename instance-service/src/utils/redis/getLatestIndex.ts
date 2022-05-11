import RedisClient from '.';
import config from '../../config';

const { redis } = config;

const getLatestIndex = async () => {
    const redisClient = RedisClient.getClient();

    return redisClient.get(redis.globalSearchKeyName);
};

export default getLatestIndex;
