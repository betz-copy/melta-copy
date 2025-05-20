import mongoose from "mongoose";
import config from "./config/index.js";

const { mongo } = config;

// AGGREGATIONS

export const getCategoryIds = [
  {
    $sort: {
      createdAt: 1,
    },
  },
  {
    $project: {
      _id: 0,
      id: { $toString: "$_id" },
    },
  },
];

export const getTemplateOrderPipeline = (categoryId) => {
  return [
    {
      $match: {
        category: categoryId,
      },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: "$_id" },
      },
    },
  ];
};

// MIGRATION SCRIPT

const connectToMongo = async () => {
  await mongoose.connect(mongo.uri);

  console.log("Connected to MongoDB");
};

const listDatabasesWithMongoose = async () => {
  const adminDb = mongoose.connection.db.admin();
  const result = await adminDb.listDatabases();
  console.log("Databases:", result.databases);

  return result.databases;
};

const getDBCategoryIds = async (db) => {
  //   const db = mongoose.connection.client.db(dbName);
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((col) => col.name);

  if (collectionNames.includes(mongo.categoriesCollection)) {
    console.log(
      `Applying aggregation to ${db.databaseName}.${mongo.categoriesCollection}`
    );

    const pipeline = getCategoryIds;
    const results = await db
      .collection(mongo.categoriesCollection)
      .aggregate(pipeline)
      .toArray();

    return results;
  }

  return null;
};

const setCategoryOrders = async (dbList) => {
  const data = [];

  await Promise.all(
    dbList.map(async (database) => {
      const db = mongoose.connection.client.db(database.name);
      const categoryIds = await getDBCategoryIds(db);

      if (categoryIds) {
        const result = await db.collection(mongo.configsCollection).insertOne({
          name: "categoryOrder",
          type: "order",
          order: categoryIds,
        });

        data.push({ dbName: database.name, categoryOrder: result });
      }
    })
  );

  console.log("Created category orders:", data);

  return data;
};
