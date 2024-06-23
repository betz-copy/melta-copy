import { LeanDocument } from 'mongoose';
import { createDocumentOnElastic } from './documentsOnElastic';
import config from '../../config';
import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ProcessInstanceModel from '../../express/instances/processes/model';
import initializeElasticsearch from './initializeElasticSearch';
import logger from '../logger/logsLogger';
import initializeMongo from '../..';

async function getAllProcesses(): Promise<LeanDocument<ProcessInstanceDocument[]>> {
    return ProcessInstanceModel.find().lean().populate(config.processFields.steps);
}

const main = async () => {
    try {
        await initializeMongo();

        await initializeElasticsearch();

        const processes = await getAllProcesses();

        await Promise.all(processes.map(createDocumentOnElastic));
    } catch (error) {
        logger.error('Error:', error);
    }
};

main();
