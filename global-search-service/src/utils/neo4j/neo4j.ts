import { logger } from '@microservices/shared';
import neo4j, { Driver, Neo4jError, QueryResult, Session, SessionMode, Transaction } from 'neo4j-driver';
import { retry } from 'ts-retry-promise';
import config from '../../config';

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

    private createSession(defaultAccessMode?: SessionMode): Session {
        return Neo4jClient.driver.session({ database: this.database, defaultAccessMode });
    }

    private async closeSession(session: Session) {
        try {
            await session.close();
        } catch (err) {
            logger.error('Failed to close session. Possible leak, Error:', { err });
        }
    }

    async wrapDBNotExistsError<T>(func: (session: Session) => Promise<T>, defaultAccessMode?: SessionMode): Promise<T> {
        const session = this.createSession(defaultAccessMode);

        try {
            const result = await func(session);
            await this.closeSession(session);
            return result;
        } catch (err) {
            await this.closeSession(session);

            // Check if the error is caused by non-existing database
            if (err instanceof Neo4jError && err.code === 'Neo.ClientError.Database.DatabaseNotFound') {
                // Create the db if it doesn't exist
                const newWorkspaceSession = Neo4jClient.driver.session();
                await newWorkspaceSession.run(`CREATE DATABASE \`${this.database}\` IF NOT EXISTS`).catch(() => {});
                await newWorkspaceSession.close();

                const newSession = this.createSession();

                // Retry
                const result = await func(newSession);
                await this.closeSession(newSession);
                return result;
            }

            // Throw the error if it's not caused by non-existing database
            throw err;
        }
    }

    async readTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('readTransaction', cypherQuery, parameters);
    }

    async writeTransaction(cypherQuery: string, parameters = {}) {
        return this.performTransaction('writeTransaction', cypherQuery, parameters);
    }

    private async performTransaction(transactionType: TransactionType, cypherQuery: string, parameters: Record<string, any>) {
        return this.wrapDBNotExistsError((session) => session[transactionType]((tx) => tx.run(cypherQuery, parameters)));
    }

    async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>) {
        return this.wrapDBNotExistsError(
            async (session) => {
                const trx = session.beginTransaction();
                const result = await transactionWork(trx);

                await trx.commit();

                return result;
            },
            transactionType === 'readTransaction' ? 'READ' : 'WRITE',
        );
    }

    async runInTransactionAndNormalize<T>(
        transaction: Transaction,
        cypherQuery: string,
        normalizeFunction: (queryResult: QueryResult) => T,
        parameters?: Record<string, any>,
    ): Promise<T> {
        const result = await transaction.run(cypherQuery, parameters);

        return normalizeFunction(result);
    }

    static async close() {
        if (Neo4jClient.isInitialized) await Neo4jClient.driver.close();
    }

    static async verifyConnectivity() {
        await retry(() => Neo4jClient.driver.verifyConnectivity(), {
            retries: connectionRetries,
            delay: connectionRetryDelay,
            logger: logger.info.bind(logger),
        });
    }
}
