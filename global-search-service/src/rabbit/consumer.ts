import { ConsumerMessage } from 'menashmq';
import { basicValidateRequest } from '../utils/joi';
import { Action, IUpdateIndexRequest } from './interfaces';
import Manager from './manager';
import { requestSchema } from './validator.schema';
import logger from '../utils/logger/logsLogger';

export const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    // Extract dbHeaderName from msg headers
    const { dbHeaderName } = msg.properties.headers;
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);
    const manager = new Manager(dbHeaderName);

    try {
        switch (action) {
            case Action.upsertGlobalIndex: {
                logger.info('Upserting global search index...');
                await manager.upsertGlobalSearchIndex();
                break;
            }

            case Action.upsertTemplateIndex: {
                logger.info(`Upserting search index of template "${templateId}"...`);
                await manager.upsertChangedTemplateSearchIndex(templateId!);
                break;
            }

            case Action.deleteTemplateIndex: {
                logger.info(`Deleting search index of template "${templateId}"...`);
                await manager.deleteTemplateSearchIndex(templateId!);
                break;
            }

            default:
                throw new Error('invalid action type (should be caught in joi valiton)');
        }
    } catch (error) {
        logger.error('Failed to update search index', { error });
        msg.nack(false);

        return;
    }

    logger.info(`Successfully updated search index!`);
    msg.ack();
};
