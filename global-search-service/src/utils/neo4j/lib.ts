import { QueryResult } from 'neo4j-driver';

const normalizeReturnedIndexes = (result: QueryResult) => {
    if (!result.records.length) {
        return null;
    }

    return result.records.map((record) => record.toObject().name);
};

export default normalizeReturnedIndexes;
