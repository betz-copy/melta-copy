import { ConsumerMessage } from 'menashmq';
import { logger, basicValidateRequest } from '@microservices/shared';
import { semanticDeleteFilesSchema, semanticIndexFilesSchema } from '../utils/joi/schemas/semantic';
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

            logger.info('Indexing files: ', { value });

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
            const value = basicValidateRequest(semanticDeleteFilesSchema, msgContent);

            const manager = new SemanticManager(msg.properties.headers[workspaceIdHeaderName]);

            logger.info('Deleting files: ', { value });

            await manager.deleteFiles(value.minioFileIds);

            msg.ack();
        } catch (err: any) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default SemanticConsumer;
