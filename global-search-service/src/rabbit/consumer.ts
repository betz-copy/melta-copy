import { ConsumerMessage } from 'menashmq';
import { deleteTemplateSearchIndex, upsertChangedTemplateSearchIndex, upsertGlobalSearchIndex } from './manager';
import { basicValidateRequest } from '../utils/joi';
import { Action, IUpdateIndexRequest } from './interfaces';
import { requestSchema } from './validator.schema';
import logger from '../utils/logger';

export const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);

    try {
        switch (action) {
            case Action.upsertGlobalIndex: {
                logger.info('Upserting global search index...');
                await upsertGlobalSearchIndex();
                break;
            }

            case Action.upsertTemplateIndex: {
                logger.info(`Upserting search index of template "${templateId}"...`);
                await upsertChangedTemplateSearchIndex(templateId!);
                break;
            }

            case Action.deleteTemplateIndex: {
                logger.info(`Deleting search index of template "${templateId}"...`);
                await deleteTemplateSearchIndex(templateId!);
                break;
            }

            default:
                throw new Error('invalid action type (should be caught in joi valiton)');
        }
    } catch (err) {
        logger.error('Failed to update search index', err);
        msg.nack(false);

        return;
    }

    logger.info(`Successfully updated search index!`);
    msg.ack();
};
