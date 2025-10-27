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
                const newWorkspaceSession = Neo4jClient.driver.session({ database: 'system' });
                await newWorkspaceSession.run(`CREATE DATABASE \`${this.database}\` IF NOT EXISTS`).catch((error) => {
                    logger.error('Failed to create database', { error });
                });
                await newWorkspaceSession.close();

                const newSession = this.createSession();

                // Retry
                try {
                    const result = await func(newSession);
                    await this.closeSession(newSession);
                    return result;
                } catch (error) {
                    await this.closeSession(newSession);
                    logger.error('Failed to perform transaction after creating database', { error });
                    throw error;
                }
            }

            // Throw the error if it's not caused by non-existing database
            throw err;
        }
    }

    async readTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('readTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async writeTransaction<T>(cypherQuery: string, normalizeResultFunction: (queryResult: QueryResult) => T, parameters = {}): Promise<T> {
        return this.performTransaction('writeTransaction', normalizeResultFunction, cypherQuery, parameters);
    }

    async performComplexTransaction<T>(transactionType: TransactionType, transactionWork: TransactionWork<T>, dryRun = false) {
        return this.wrapDBNotExistsError(
            async (session) => {
                const trx = session.beginTransaction();
                const result = await transactionWork(trx);

                if (dryRun) await trx.rollback();
                else await trx.commit();

                return result;
            },
            transactionType === 'readTransaction' ? 'READ' : 'WRITE',
        );
    }

    private async performTransaction<T>(
        transactionType: TransactionType,
        normalizeResultFunction: (queryResult: QueryResult) => T,
        cypherQuery: string,
        parameters: Record<string, any>,
    ): Promise<T> {
        return this.wrapDBNotExistsError(async (session) =>
            normalizeResultFunction(await session[transactionType]((tx) => tx.run(cypherQuery, parameters))),
        );
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

    async getAllGlobalSearchIndexNames() {
        const cypher = `
            SHOW INDEXES YIELD name
            WHERE name STARTS WITH '${config.neo4j.globalSearchIndexPrefix}'
            RETURN name;`;

        const result = await this.readTransaction(cypher, (queryResult: QueryResult) => queryResult.records.map((record) => record.get(0)));
        return result;
    }
}
