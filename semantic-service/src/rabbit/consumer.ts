import { basicValidateRequest, logger } from '@packages/utils';
import { ConsumerMessage } from 'menashmq';
import config from '../config';
import { EmbeddingManager } from '../express/embedding/manager';
import { semanticDeleteFilesSchema, semanticIndexFilesSchema } from '../utils/joi/schemas/semantic';
import { IIndexFilesRequest } from '../utils/types';

const { workspaceIdHeaderName } = config.service;

class SemanticConsumer {
    static async indexFiles(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value: IIndexFilesRequest = basicValidateRequest(semanticIndexFilesSchema, msgContent);

            const manager = new EmbeddingManager(msg.properties.headers[workspaceIdHeaderName]);

            logger.info('Indexing files: ', { value });

            await manager.indexFiles(value);

            msg.ack();
        } catch (err: unknown) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }

    static async deleteFiles(msg: ConsumerMessage) {
        try {
            const msgContent = msg.getContent();
            const value = basicValidateRequest(semanticDeleteFilesSchema, msgContent);

            const manager = new EmbeddingManager(msg.properties.headers[workspaceIdHeaderName]);

            logger.info('Deleting files: ', { value });

            await manager.deleteFiles(value.minioFileIds);

            msg.ack();
        } catch (err: unknown) {
            logger.error('Rabbit consumer error: ', { error: err });
            msg.nack(false);
        }
    }
}

export default SemanticConsumer;
