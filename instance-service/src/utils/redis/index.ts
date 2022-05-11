import Redis from 'ioredis';
import { once } from 'events';

class RedisClient {
    private redisClient: Redis;

    async initialize(url: string) {
        this.redisClient = new Redis(url);

        await once(this.redisClient, 'ready');
    }

    getClient() {
        return this.redisClient;
    }
}

export default new RedisClient();
