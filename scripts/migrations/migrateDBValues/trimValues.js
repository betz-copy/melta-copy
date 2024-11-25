const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const neo4j = require("neo4j-driver");

const mongoUri = "mongodb://localhost:27017";
const targetCollection = "entity-templates";

const getTrimmedValues = async (client) => {
  const data = [];

  const adminDb = client.db().admin();
  const dbs = (await adminDb.listDatabases()).databases;

  for (const database of dbs) {
    const dbName = database.name;

    // Switch to the target database
    const currentDb = client.db(dbName);

    // Check if the target collection exists
    const collections = await currentDb.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(targetCollection)) {
      console.log(`Applying aggregation to ${dbName}.${targetCollection}`);

      // Define the aggregation pipeline
      const pipeline = [
        {
          $set: {
            "properties.properties": {
              $map: {
                input: { $objectToArray: "$properties.properties" },
                as: "property",
                in: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$$property.v.enum", null] },
                        { $isArray: "$$property.v.enum" },
                      ],
                    },
                    then: { k: "$$property.k", v: false },
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$$property.v.items", null] },
                            { $ne: ["$$property.v.items.enum", null] },
                            { $isArray: "$$property.v.items.enum" },
                          ],
                        },
                        then: { k: "$$property.k", v: true },
                        else: {},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $set: {
            property: {
              $filter: {
                input: "$properties.properties",
                as: "property",
                cond: { $ne: ["$$property", {}] },
              },
            },
          },
        },
        { $match: { property: { $ne: [] } } },
        {
          $project: {
            name: true,
            displayName: true,
            property: true,
          },
        },
      ];

      // Run the aggregation and collect results
      const results = await currentDb
        .collection(targetCollection)
        .aggregate(pipeline)
        .toArray();

      const lastIndex = results.length - 1;

      const query = results.reduce((final, curr, index) => {
        const start = "match (n:`" + curr._id + "`) ";
        const setProperties = curr.property.reduce(
          (allProperties, currProperty) => {
            const setQuery = currProperty.v
              ? `SET n.${currProperty.k} = case when n.${currProperty.k} is null then n.${currProperty.k} else [item IN n.${currProperty.k} | trim(item)] end `
              : `SET n.${currProperty.k} = case when n.${currProperty.k} is null then n.${currProperty.k} else trim(n.${currProperty.k}) end `;

            return allProperties + setQuery;
          },
          ""
        );
        const union = index === lastIndex ? "" : "union all ";

        return final + start + setProperties + `return n ` + union;
      }, "");

      data.push({ dbName, entities: results, query });
    }
  }

  return data;
};

const trimValuesMongo = async (client) => {
  const targetCollection = "entity-templates";
  const adminDb = client.db().admin();
  const dbs = (await adminDb.listDatabases()).databases;

  for (const database of dbs) {
    const dbName = database.name;

    // Switch to the target database
    const currentDb = client.db(dbName);

    // Check if the target collection exists
    const collections = await currentDb.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    if (collectionNames.includes(targetCollection)) {
      console.log(
        `Applying aggregation and update to ${dbName}.${targetCollection}`
      );

      // Define the update pipeline
      const pipeline = [
        {
          $set: {
            "properties.properties": {
              $map: {
                input: {
                  $objectToArray: "$properties.properties",
                },
                as: "property",
                in: {
                  k: "$$property.k",
                  v: {
                    $mergeObjects: [
                      "$$property.v",
                      {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$$property.v.enum", null] },
                              { $isArray: "$$property.v.enum" },
                            ],
                          },
                          then: {
                            enum: {
                              $map: {
                                input: "$$property.v.enum",
                                as: "enumValue",
                                in: { $trim: { input: "$$enumValue" } },
                              },
                            },
                          },
                          else: {},
                        },
                      },
                      {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$$property.v.items", null] },
                              { $ne: ["$$property.v.items.enum", null] },
                              { $isArray: "$$property.v.items.enum" },
                            ],
                          },
                          then: {
                            items: {
                              type: "$$property.v.items.type", // Added type field here
                              enum: {
                                $map: {
                                  input: "$$property.v.items.enum",
                                  as: "itemEnumValue",
                                  in: { $trim: { input: "$$itemEnumValue" } },
                                },
                              },
                            },
                          },
                          else: {},
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $set: {
            "properties.properties": {
              $arrayToObject: "$properties.properties",
            },
          },
        },
      ];
      // Apply the update using an aggregation pipeline
      const result = await currentDb
        .collection(targetCollection)
        .updateMany({}, pipeline);

      console.log(
        `Updated ${result.matchedCount} documents in ${dbName}.${targetCollection}, modified ${result.modifiedCount} documents`
      );
    }
  }
};

const trimValuesNeo = async (data) => {
  const uri = "bolt://localhost:7687"; // Change to your Neo4j URI
  const user = "neo4j"; // Replace with your username
  const password = "test1234"; // Replace with your password

  // Create a Neo4j driver instance
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    await Promise.all(
      data.map(async (db) => {
        console.log({ db });

        const session = driver.session({ database: `workspace-${db.dbName}` });

        try {
          // Cypher query to fetch 25 nodes
          const result = await session.run(db.query);

          // Extracting nodes
          const nodes = result.records.map(
            (record) => record.get("n").properties
          );
        } catch (error) {
          console.error("Error fetching nodes:", error);
        } finally {
          // Close session and driver
          await session.close();
          //   await driver.close();
        }
      })
    );
  } catch (err) {
    console.error("Unexpected error:", err);
  } finally {
    // Close the driver after all databases are processed
    await driver.close();
  }
};

const main = async () => {
  try {
    // Connect to MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();

    console.log("Connected to MongoDB");
    const data = await getTrimmedValues(client);

    await trimValuesMongo(client);
    await trimValuesNeo(data);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Ensure the connection is closed
    mongoose.connections.forEach((conn) => conn.close());
  }
};

// Run the main function
main();
