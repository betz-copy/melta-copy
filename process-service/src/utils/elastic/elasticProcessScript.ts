import * as mongoose from 'mongoose';
import { LeanDocument } from 'mongoose';
import { createDocumentOnElastic } from './documentsOnElastic';
import config from '../../config';
import ElasticClient from './index';
import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ProcessInstanceModel from '../../express/instances/processes/model';

const { mongo } = config;

async function getAllProcesses(): Promise<LeanDocument<ProcessInstanceDocument[]>> {
    try {
        const query = ProcessInstanceModel.find().lean();
        return query.populate(config.processFields.steps);
    } catch (error) {
        console.error('Error fetching processes:', error);
        throw error;
    }
}
async function main() {
    try {
        await mongoose.connect(mongo.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true,
            // serverSelectionTimeoutMS: 50000,
            // socketTimeoutMS: 60000,
            // connectTimeoutMS: 60000,
        });
        const processes = await getAllProcesses();
        // console.log({ processes });
        await ElasticClient.initialize('http://elastic:9200');
        await Promise.all(processes.map(createDocumentOnElastic));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
