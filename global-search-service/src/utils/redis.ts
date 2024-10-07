import { once } from 'events';
import Redis from 'ioredis';
import config from '../config';

export default class RedisClient {
    private static redisClient: Redis;

    private prefix: string;

    constructor(workspaceId: string) {
        this.prefix = workspaceId;
    }

    public static async initialize() {
        this.redisClient = new Redis(config.redis.url);

        await once(this.redisClient, 'ready');
    }

    // Function to add the prefix to a key
    private addPrefixToKey(key: string) {
        return `${this.prefix}:${key}`;
    }

    // Function to set a key with a dynamic prefix (workspaceId)
    public async set(key: string, value) {
        await RedisClient.redisClient.set(this.addPrefixToKey(key), value);
    }

    // Function to get a key with a dynamic prefix (workspaceId)
    public async get(key: string) {
        const returnedKey = await RedisClient.redisClient.get(this.addPrefixToKey(key));
        return returnedKey?.replace(this.prefix, '');
    }

    // Function to delete a key with a dynamic prefix (workspaceId)
    public async del(key: string) {
        await RedisClient.redisClient.del(this.addPrefixToKey(key));
    }
}
