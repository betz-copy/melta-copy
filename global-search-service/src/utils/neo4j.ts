import neo4j, { Driver, Config } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';

import config from '../config';
import { trycatch } from './index';
import logger from './logger/logsLogger';
import { ServiceError } from '../error';
import { StatusCodes } from 'http-status-codes';

interface Neo4jAuth {
    username: string;
    password: string;
}

type TransactionType = 'writeTransaction' | 'readTransaction';

class Neo4jClient {
    private driver: Driver;

    private database: string;

    private isInitialized: boolean;

    constructor() {
        this.isInitialized = false;
    }

    async initialize(url: string, auth: Neo4jAuth, database: string, configuration: Config = {}) {
        this.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), configuration);
        this.database = database;

        await this.verifyConnectivity();

        logger.info('[NEO4J]: client initialized');

        this.isInitialized = true;
    }

    async readTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('readTransaction', cypherQuery, parameters);
    }

    async writeTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('writeTransaction', cypherQuery, parameters);
    }

    async performTransaction(transactionType: TransactionType, cypherQuery: string, parameters = {}) {
        const session = this.driver.session({ database: this.database });

        try {
            const result = await session[transactionType]((tx) => tx.run(cypherQuery, parameters));

            return result;
        } finally {
            const { err: error } = await trycatch(() => session.close());

            if (error) throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to close session', { error });
        }
    }

    async close() {
        if (this.isInitialized) {
            await this.driver.close();
        }
    }

    async verifyConnectivity() {
        const { connectionRetries, connectionRetryDelay } = config.neo4j;

        await retry(() => this.driver.verifyConnectivity(), {
            retries: connectionRetries,
            delay: connectionRetryDelay,
            logger: logger.info.bind(logger),
        });
    }
}

export default new Neo4jClient();
