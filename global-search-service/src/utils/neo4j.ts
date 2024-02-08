import neo4j, { Driver, Neo4jError, QueryResult, Session, Transaction } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';
import config from '../config';

const { url, auth, connectionRetries, connectionRetryDelay } = config.neo4j;

type TransactionType = 'writeTransaction' | 'readTransaction';
type TransactionWork<T> = (tx: Transaction) => Promise<T> | T;

export default class Neo4jClient {
    private static driver: Driver;

    private static isInitialized: boolean = false;

    private database: string;

    private currSession: Session;

    constructor(database: string) {
        this.database = database;
    }

    static async initialize() {
        Neo4jClient.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password));

        await Neo4jClient.verifyConnectivity();

        console.log('[NEO4J]: client initialized');

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
                await this.createSession({}).run(`CREATE DATABASE ${this.database} IF NOT EXISTS`);

                // Retry
                return func();
            }

            // Throw the error if it's not caused by non-existing database
            throw err;
        } finally {
            try {
                await this.currSession.close();
            } catch (err) {
                console.error('Failed to close session. Possible leak, Error:', err);
            }
        }
    }

    async readTransaction<T>(cypherQuery: string, normalizeResultFunction?: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'readTransaction', cypherQuery, parameters, normalizeResultFunction));
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction?: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'writeTransaction', cypherQuery, parameters, normalizeResultFunction));
    }

    async performComplexReadTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'readTransaction', transactionWork));
    }

    async performComplexWriteTransaction<T>(transactionWork: TransactionWork<T>): Promise<T> {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'writeTransaction', transactionWork));
    }

    private async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        const result = await this.session[transactionType](transactionWork);

        return result;
    }

    private async performTransaction<T>(
        transactionType: TransactionType,
        cypherQuery: string,
        parameters: Record<string, any>,
        normalizeResultFunction?: (queryResult: QueryResult) => T,
    ): Promise<T> {
        const result = await this.session[transactionType]((tx) => tx.run(cypherQuery, parameters));

        return normalizeResultFunction ? normalizeResultFunction(result) : (result as unknown as T);
    }

    static async close() {
        if (this.isInitialized) await Neo4jClient.driver.close();
    }

    static async verifyConnectivity() {
        await retry(() => Neo4jClient.driver.verifyConnectivity(), { retries: connectionRetries, delay: connectionRetryDelay, logger: console.log });
    }
}
