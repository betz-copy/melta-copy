import { createClient, RedisClientType } from 'redis';
import config from '../../config';

const { url } = config.redis;

class RedisService {
    private client: RedisClientType;
    private isConnected = false;

    constructor() {
        this.client = createClient({ url, database: 1 });

        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.on('connect', () => console.log('Redis connected successfully'));
    }

    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
            this.isConnected = true;
        }
        return this.client;
    }

    async get(key: string) {
        const client = await this.connect();
        return client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number) {
        const client = await this.connect();
        if (ttlSeconds) {
            return client.set(key, value, { EX: ttlSeconds });
        }
        return client.set(key, value);
    }

    async delete(key: string) {
        const client = await this.connect();
        return client.del(key);
    }
}

export const redis = new RedisService();
