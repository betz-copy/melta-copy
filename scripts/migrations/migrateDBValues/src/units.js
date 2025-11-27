import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import config from './config/index.js';

const { mongo, neo } = config;

const unitsNeo = async (driver) => {
    try {
        const unitsCollection = mongoose.connection.client.db('global').collection(mongo.unitsCollection);

        for (const workspaceId of ['TODO']) {
            if (workspaceId === 'TODO') throw new Error('bad db id, please change');

            const session = driver.session({ database: `workspace-${workspaceId}` });

            const units = await unitsCollection.aggregate([{ $match: { workspaceId } }]).toArray();
            const unitsMap = new Map(units.map((unit) => [unit.name, unit._id]));

            const templatesCollection = mongoose.connection.client.db(workspaceId).collection(mongo.templatesCollection);

            try {
                const templates = await templatesCollection.aggregate().toArray();

                if (!templates.length) throw new Error(`no templates in ${workspaceId}`);

                for (const template of templates) {
                    const keys = [];
                    Object.entries(template.properties.properties).forEach(([key, property]) => {
                        if (property.format === 'unitField') keys.push(key);
                    });

                    if (!keys.length) continue;

                    await session.writeTransaction(async (tx) => {
                        const entities = await tx.run(`
                            MATCH (n:\`${template._id}\`)
                            RETURN n
                        `);

                        const promises = [];

                        for (const entity of entities.records) {
                            for (const key of keys) {
                                const properties = entity.toObject().n.properties;

                                if (key in properties) {
                                    const unit = unitsMap.get(properties[key]);

                                    if (unit) {
                                        promises.push(
                                            tx.run(`
                                                MATCH (n:\`${template._id}\` {_id: '${properties._id}'})
                                                SET n.${key} = '${unit}'
                                                RETURN n
                                            `),
                                        );
                                    }
                                }
                            }
                        }

                        await Promise.all(promises);
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                await session.close();
            }
        }

        console.log('finish neo');
    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await driver.close();
    }
};

const connectToMongo = async () => {
    await mongoose.connect(mongo.uri);

    console.log('Connected to MongoDB');
};

const connectToNeo = async () => {
    const driver = neo4j.driver(neo.uri, neo4j.auth.basic(neo.user, neo.password));
    console.log('Connected to neo');

    return driver;
};

const main = async () => {
    try {
        await connectToMongo();

        const neoDriver = await connectToNeo();

        await unitsNeo(neoDriver);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connections.forEach((conn) => conn.close());
    }
};

main().then(() => {
    console.log('units neo4j migration');
});
