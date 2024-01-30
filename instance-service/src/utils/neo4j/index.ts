import neo4j, { Config, Driver, Neo4jError, QueryResult, Session, Transaction } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';
import config from '../../config';

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

    private currSession: Session;

    constructor(database: string) {
        this.isInitialized = false;
        this.database = database;
    }

    async initialize(url: string, auth: Neo4jAuth, configuration: Config = {}) {
        this.driver = neo4j.driver(url, neo4j.auth.basic(auth.username, auth.password), configuration);

        await this.verifyConnectivity();

        console.log('[NEO4J]: client initialized');

        this.isInitialized = true;
    }

    private createSession(sessionOptions: { database?: string } = { database: this.database }) {
        return this.driver.session(sessionOptions);
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

    async readTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'readTransaction', normalizeResultFunction, cypherQuery, parameters));
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.wrapDBNotExistsError(this.performTransaction.bind(this, 'writeTransaction', normalizeResultFunction, cypherQuery, parameters));
    }

    async performComplexReadTransaction<T>(transactionWork: TransactionWork<T>) {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'readTransaction', transactionWork));
    }

    async performComplexWriteTransaction<T>(transactionWork: TransactionWork<T>) {
        return this.wrapDBNotExistsError(this.performComplexTransaction.bind(this, 'writeTransaction', transactionWork));
    }

    private async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        const result = await this.session[transactionType](transactionWork);

        return result;
    }

    private async performTransaction<T>(
        transactionType: TransactionType,
        normalizeResultFunction: (queryResult: QueryResult) => T,
        cypherQuery: string,
        parameters: Record<string, any>,
    ): Promise<T> {
        const result = await this.session[transactionType]((tx) => tx.run(cypherQuery, parameters));

        return normalizeResultFunction(result);
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

export default Neo4jClient;
