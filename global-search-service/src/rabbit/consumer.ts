import { ConsumerMessage } from 'menashmq';
import { basicValidateRequest } from '../utils/joi';
import { Action, IUpdateIndexRequest } from './interfaces';
import Manager from './manager';
import { requestSchema } from './validator.schema';

export const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    // Extract dbHeaderName from msg headers
    const { dbHeaderName } = msg.properties.headers;
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);
    const manager = new Manager(dbHeaderName);

    try {
        switch (action) {
            case Action.upsertGlobalIndex: {
                console.log('Upserting global search index...');
                await manager.upsertGlobalSearchIndex();
                break;
            }

            case Action.upsertTemplateIndex: {
                console.log(`Upserting search index of template "${templateId}"...`);
                await manager.upsertChangedTemplateSearchIndex(templateId!);
                break;
            }

            case Action.deleteTemplateIndex: {
                console.log(`Deleting search index of template "${templateId}"...`);
                await manager.deleteTemplateSearchIndex(templateId!);
                break;
            }

            default:
                throw new Error('invalid action type (should be caught in joi valiton)');
        }
    } catch (err) {
        console.log('Failed to update search index', err);
        msg.nack(false);

        return;
    }

    console.log(`Successfully updated search index!`);
    msg.ack();
};
