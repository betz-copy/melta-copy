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

    private currSession: Session;

    constructor(database: string) {
        this.database = `${workspaceNamePrefix}${database}`;
    }

    static async initialize() {
        Neo4jClient.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), { disableLosslessIntegers: true });

        await Neo4jClient.verifyConnectivity();

        logger.info('[NEO4J]: client initialized');

        Neo4jClient.isInitialized = true;
    }

    private createSession(sessionOptions: { database?: string } = { database: this.database }) {
        return Neo4jClient.driver.session(sessionOptions);
    }

    private get session() {
        if (!this.currSession) this.currSession = this.createSession();

        return this.currSession;
    }

    async wrapDBNotExistsError(func: () => Promise<any>) {
        try {
            return await func();
        } catch (err) {
            // Check if the error is caused by non-existing database
            if (err instanceof Neo4jError && err.code === 'Neo.ClientError.Database.DatabaseNotFound') {
                // Create the db if it doesn't exist
                await this.createSession({}).run(`CREATE DATABASE \`${this.database}\` IF NOT EXISTS`);

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
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'readTransaction', normalizeResultFunction, cypherQuery, parameters));
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'writeTransaction', normalizeResultFunction, cypherQuery, parameters));
    }

    async performComplexReadTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'readTransaction', transactionWork));
    }

    async performComplexWriteTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'writeTransaction', transactionWork));
    }

    async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        const result = await this.session[transactionType](transactionWork);

        return result;
    }

    private async performTransaction<T>(
        transactionType: TransactionType,
        normalizeResultFunction: (queryResult: QueryResult) => T,
        cypherQuery: string,
        parameters: Record<string, any>,
    ): Promise<T> {
        try {
            const result = await this.session[transactionType]((tx) => tx.run(cypherQuery, parameters));

            return normalizeResultFunction(result);
        } finally {
            try {
                await this.session.close();
            } catch (err) {
                console.error('Failed to close session. Possible leak, Error:', { err });
            }
        }
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
