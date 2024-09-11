import { ConsumerMessage } from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import { basicValidateRequest } from '../utils/joi';
import { Action, IUpdateIndexRequest } from './interfaces';
import Manager from './manager';
import { requestSchema } from './validator.schema';
import logger from '../utils/logger/logsLogger';
import { ServiceError } from '../error';
import config from '../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);

    const manager = new Manager(msg.properties.headers[workspaceIdHeaderName]);

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
                throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'invalid action type (should be caught in joi valiton)');
        }
    } catch (error) {
        msg.nack(false);
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update search index', { error });
    }

    logger.info(`Successfully updated search index!`);
    msg.ack();
};
