import { ConsumerMessage } from 'menashmq';
import { basicValidateRequest } from '../utils/joi';
import { semanticIndexFilesSchema } from '../utils/joi/schemas/semantic';
import { logger } from '@microservices/shared';
import config from '../config';
import { SemanticManager } from '../express/semantics/manager';
import { IIndexFilesRequest } from '../express/semantics/interface';

const {
    service: { workspaceIdHeaderName },
} = config;

class SemanticConsumer {
    static async indexFiles(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value: IIndexFilesRequest = basicValidateRequest(semanticIndexFilesSchema, msgContent);

            const manager = new SemanticManager(msg.properties.headers[workspaceIdHeaderName]);

            console.log('Indexing files: ', value);

            await manager.indexFiles(value);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }

    static async deleteFiles(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(semanticIndexFilesSchema, msgContent);

            const manager = new SemanticManager(msg.properties.headers[workspaceIdHeaderName]);

            console.log('Deleting files: ', value);

            await manager.deleteFiles(value.minioFileIds);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default SemanticConsumer;
