import { IndexingAction, IUpdateIndexRequest } from '@packages/global-search';
import { basicValidateRequest, logger, ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import { ConsumerMessage } from 'menashmq';
import config from '../config';
import Manager from './manager';
import { requestSchema } from './validator.schema';

const {
    service: { workspaceIdHeaderName },
} = config;

const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);

    const manager = new Manager(msg.properties.headers[workspaceIdHeaderName]);

    try {
        switch (action) {
            case IndexingAction.upsertGlobalIndex: {
                logger.info('Upserting global search index...');
                await manager.upsertGlobalSearchIndex();
                break;
            }

            case IndexingAction.upsertTemplateIndex: {
                logger.info(`Upserting search index of template "${templateId}"...`);
                await manager.upsertChangedTemplateSearchIndex(templateId!);
                break;
            }

            case IndexingAction.deleteTemplateIndex: {
                logger.info(`Deleting search index of template "${templateId}"...`);
                await manager.deleteTemplateSearchIndex(templateId!);
                break;
            }

            default:
                throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'invalid action type (should be caught in joi validation)');
        }
    } catch (error) {
        logger.error('Failed to update search index', { error });
        msg.nack(false);

        return;
    }

    logger.info(`Successfully updated search index!`);
    msg.ack();
};

export default updateIndexConsumeFunction;
