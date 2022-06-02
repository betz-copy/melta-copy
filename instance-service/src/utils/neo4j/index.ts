import neo4j, { Driver, Config } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';

import config from '../../config';
import { trycatch } from '../lib';

interface Neo4jAuth {
    username: string;
    password: string;
}

type TransactionType = 'writeTransaction' | 'readTransaction';

class Neo4jClient {
    private driver: Driver;

    private isInitialized: boolean;

    constructor() {
        this.isInitialized = false;
    }

    async initialize(url: string, auth: Neo4jAuth, configuration: Config = {}) {
        this.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), configuration);

        await this.verifyConnectivity();

        console.log('[NEO4J]: client initialized');

        this.isInitialized = true;
    }

    async readTransaction(cypherQuery: string, normalizeResultFunction: Function, parameters = {}, database = 'neo4j') {
        return this.performTransaction('readTransaction', normalizeResultFunction, cypherQuery, parameters, database);
    }

    async writeTransaction(cypherQuery: string, normalizeResultFunction: Function, parameters = {}, database = 'neo4j') {
        return this.performTransaction('writeTransaction', normalizeResultFunction, cypherQuery, parameters, database);
    }

    async performTransaction(
        transactionType: TransactionType,
        normalizeResultFunction: Function,
        cypherQuery: string,
        parameters: Record<string, any>,
        database: string,
    ) {
        const session = this.driver.session({ database });

        try {
            const result = await session[transactionType]((tx) => tx.run(cypherQuery, parameters));

            return normalizeResultFunction(result);
        } finally {
            const { err } = await trycatch(() => session.close());

            if (err) {
                console.error('Failed to close session. Possible leak, Error:', err);
            }
        }
    }

    async close() {
        if (this.isInitialized) {
            await this.driver.close();
        }
    }

    async verifyConnectivity() {
        const { connectionRetries, connectionRetryDelay } = config.neo4j;

        await retry(() => this.driver.verifyConnectivity(), { retries: connectionRetries, delay: connectionRetryDelay, logger: console.log });
    }
}

export default new Neo4jClient();
