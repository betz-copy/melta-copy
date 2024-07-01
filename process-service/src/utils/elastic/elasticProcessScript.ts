// import { LeanDocument } from 'mongoose';
import { createDocumentOnElastic } from './documentsOnElastic';
import config from '../../config';
// import { ProcessInstanceDocument } from '../../express/instances/processes/interface';
import ProcessInstanceModel from '../../express/instances/processes/model';
import initializeElasticsearch from './initializeElasticSearch';
import logger from '../logger/logsLogger';
import initializeMongo from '../..';

const fs = require('fs').promises;

async function getAllProcesses() {
    try {
        const processes = await ProcessInstanceModel.find().lean().populate(config.processFields.steps);
        return processes;
    } catch (error) {
        console.error('Error fetching processes:', error);
        throw error;
    }
}

async function main() {
    try {
        await initializeMongo();
        await initializeElasticsearch();

        const processes = await getAllProcesses();

        const results = await Promise.allSettled(processes.map((process) => createDocumentOnElastic(process)));
        console.log({ results });

        const successfulProcesses = results.filter((result) => result.status === 'fulfilled');
        const failedProcesses = results.filter((result) => result.status === 'rejected');
        console.log({ successfulProcesses }, { failedProcesses });

        await fs.writeFile('successful_processes.json', JSON.stringify(successfulProcesses, null, 2));
        await fs.writeFile('failed_processes.json', JSON.stringify(failedProcesses, null, 2));

        logger.info('Process completed.');
    } catch (error) {
        logger.error('Error:', error);
    }
}

main();

// async function getAllProcesses(): Promise<LeanDocument<ProcessInstanceDocument[]>> {
//     return ProcessInstanceModel.find().lean().populate(config.processFields.steps);
// }

// const main = async () => {
//     try {
//         await initializeMongo();

//         await initializeElasticsearch();

//         const processes = await getAllProcesses();

//         const allDocumentOnElasticStatus = await Promise.allSettled(processes.map(createDocumentOnElastic));
//         console.log({ allDocumentOnElasticStatus });

//         const { fulfilled, rejected } = allDocumentOnElasticStatus.reduce(
//             (acc: { fulfilled: PromiseFulfilledResult<void>[]; rejected: PromiseRejectedResult[] }, result) => {
//                 if (result.status === 'fulfilled') {
//                     acc.fulfilled.push(result);
//                 } else if (result.status === 'rejected') {
//                     acc.rejected.push(result);
//                 }
//                 return acc;
//             },
//             { fulfilled: [], rejected: [] },
//         );

//         console.log({ fulfilled, rejected });
//     } catch (error) {
//         logger.error('Error:', error);
//     }
// };

// main();
