import { LeanDocument } from 'mongoose';
import { createDocumentOnElastic } from './documentsOnElastic';
import config from '../../config';
import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ProcessInstanceModel from '../../express/instances/processes/model';
import { initializeElasticsearch, initializeMongo } from '../..';

async function getAllProcesses(): Promise<LeanDocument<ProcessInstanceDocument[]>> {
    try {
        const query = ProcessInstanceModel.find().lean();
        return query.populate(config.processFields.steps);
    } catch (error) {
        console.error('Error accepting processes: ', error);
        throw error;
    }
}
async function main() {
    try {
        await initializeMongo();

        await initializeElasticsearch();

        const processes = await getAllProcesses();

        await Promise.all(processes.map(createDocumentOnElastic));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
