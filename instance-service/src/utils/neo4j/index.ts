import neo4j, { Driver, Neo4jError, QueryResult, Session, Transaction } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';
import config from '../../config';
import logger from '../logger/logsLogger';

const { url, auth, connectionRetries, connectionRetryDelay, workspaceNamePrefix } = config.neo4j;

type TransactionType = 'writeTransaction' | 'readTransaction';
type TransactionWork<T> = (tx: Transaction) => Promise<T> | T;

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

    async readTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('readTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('writeTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async performComplexReadTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.performComplexTransaction('readTransaction', transactionWork);
    }

    async performComplexWriteTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.performComplexTransaction('writeTransaction', transactionWork);
    }

    async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        return this.wrapDBNotExistsError(() => this.session[transactionType](transactionWork));
    }

    private async performTransaction<T>(
        transactionType: TransactionType,
        normalizeResultFunction: (queryResult: QueryResult) => T,
        cypherQuery: string,
        parameters: Record<string, any>,
    ): Promise<T> {
        return this.wrapDBNotExistsError(async () =>
            normalizeResultFunction(await this.session[transactionType]((tx) => tx.run(cypherQuery, parameters))),
        );
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
