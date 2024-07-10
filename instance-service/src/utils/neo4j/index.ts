import neo4j, { Driver, Config, Transaction, QueryResult } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';

import { trycatch } from '../lib';
import config from '../../config';
import logger from '../logger/logsLogger';

interface Neo4jAuth {
    username: string;
    password: string;
}

type TransactionType = 'writeTransaction' | 'readTransaction';
type TransactionWork<T> = (tx: Transaction) => Promise<T> | T;

class Neo4jClient {
    private driver: Driver;

    private database: string;

    private isInitialized: boolean;

    constructor() {
        this.isInitialized = false;
    }

    async initialize(url: string, auth: Neo4jAuth, database: string, configuration: Config = {}) {
        this.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), { disableLosslessIntegers: true, ...configuration });
        this.database = database;

        await this.verifyConnectivity();

        logger.info('[NEO4J]: client initialized');

        this.isInitialized = true;
    }

    async readTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('readTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('writeTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        const session = this.driver.session({ database: this.database });

        try {
            const result = await session[transactionType](transactionWork);

            return result;
        } finally {
            const { err: error } = await trycatch(() => session.close());
            if (error) {
                logger.error('Failed to close session. Possible leak, Error:', { error });
            }
        }
    }

    async performTransaction<T>(
        transactionType: TransactionType,
        normalizeResultFunction: (queryResult: QueryResult) => T,
        cypherQuery: string,
        parameters: Record<string, any>,
    ): Promise<T> {
        const session = this.driver.session({ database: this.database });

        try {
            const result = await session[transactionType]((tx) => tx.run(cypherQuery, parameters));

            return normalizeResultFunction(result);
        } finally {
            const { err: error } = await trycatch(() => session.close());

            if (error) {
                logger.error('Failed to close session. Possible leak, Error:', { error });
            }
        }
    }

    getSession() {
        return this.driver.session({ database: this.database });
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
