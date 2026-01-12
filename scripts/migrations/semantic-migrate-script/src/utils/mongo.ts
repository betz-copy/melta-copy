import { forEach } from 'lodash';
import mongoose, { Types } from 'mongoose';
import config from '../config';

const { mongo } = config;

export const initializeMongo = async () => {
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.url, mongo.connectionOptions);

    console.log('Mongo connection established');
};

export const transformObjectIdKeysToString = (doc: Record<string, unknown>) => {
    forEach(doc, (val, key) => {
        if (val instanceof Types.ObjectId) {
            doc[key] = val.toString();
        }
    });
};

export const transformResultDocsObjectIdKeysToString = (res: Record<string, unknown> | Record<string, unknown>[]) => {
    if (Array.isArray(res)) {
        res.forEach((doc) => {
            transformObjectIdKeysToString(doc);
        });
        return;
    }

    transformObjectIdKeysToString(res);
};
