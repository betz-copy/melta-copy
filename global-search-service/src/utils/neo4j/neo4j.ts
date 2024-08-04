import neo4j, { Driver, Neo4jError, Session } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';
import config from '../../config';
import logger from '../logger/logsLogger';

const { url, auth, connectionRetries, connectionRetryDelay, workspaceNamePrefix } = config.neo4j;

type TransactionType = 'writeTransaction' | 'readTransaction';

export default class Neo4jClient {
    private static driver: Driver;

    private static isInitialized: boolean = false;

    private database: string;

    constructor(workspaceId: string) {
        this.database = `${workspaceNamePrefix}${workspaceId}`;
    }

    static async initialize() {
        Neo4jClient.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), { disableLosslessIntegers: true });

        await Neo4jClient.verifyConnectivity();

        logger.info('[NEO4J]: client initialized');

        Neo4jClient.isInitialized = true;
    }

    private get session(): Session {
        return Neo4jClient.driver.session({ database: this.database });
    }

    async wrapDBNotExistsError<T>(func: () => Promise<T>): Promise<T> {
        try {
            // For some reason, func needs to be awaited here, otherwise the error doesn't get caught
            return await func();
        } catch (err) {
            // Check if the error is caused by non-existing database
            if (err instanceof Neo4jError && err.code === 'Neo.ClientError.Database.DatabaseNotFound') {
                // Create the db if it doesn't exist
                await Neo4jClient.driver
                    .session()
                    .run(`CREATE DATABASE \`${this.database}\` IF NOT EXISTS`)
                    .catch(() => {});

                // Retry
                return func();
            }

            // Throw the error if it's not caused by non-existing database
            throw err;
        } finally {
            try {
                await this.session.close();
            } catch (err) {
                console.error('Failed to close session. Possible leak, Error:', { err });
            }
        }
    }

    async readTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('readTransaction', cypherQuery, parameters);
    }

    async writeTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('writeTransaction', cypherQuery, parameters);
    }

    private async performTransaction(transactionType: TransactionType, cypherQuery: string, parameters: Record<string, any>) {
        return this.wrapDBNotExistsError(() => this.session[transactionType]((tx) => tx.run(cypherQuery, parameters)));
    }

    static async close() {
        if (this.isInitialized) await Neo4jClient.driver.close();
    }

    static async verifyConnectivity() {
        await retry(() => this.driver.verifyConnectivity(), {
            retries: connectionRetries,
            delay: connectionRetryDelay,
            logger: logger.info.bind(logger),
        });
    }
}
