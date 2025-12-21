import { basicValidateRequest, logger } from '@packages/utils';
import { ConsumerMessage } from 'menashmq';
import config from '../config';
import { IIndexFilesRequest } from '../express/semantics/interface';
import { SemanticManager } from '../express/semantics/manager';
import { semanticDeleteFilesSchema, semanticIndexFilesSchema } from '../utils/joi/schemas/semantic';

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
