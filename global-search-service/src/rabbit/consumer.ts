import { ConsumerMessage } from 'menashmq';
import { deleteTemplateSearchIndex, upsertChangedTemplateSearchIndex, upsertGlobalSearchIndex } from './manager';
import { basicValidateRequest } from '../utils/joi';
import { Action, IUpdateIndexRequest } from './interfaces';
import { requestSchema } from './validator.schema';

export const updateIndexConsumeFunction = async (msg: ConsumerMessage) => {
    const msgContent = msg.getContent();
    const { action, templateId }: IUpdateIndexRequest = basicValidateRequest(requestSchema, msgContent);

    try {
        switch (action) {
            case Action.upsertGlobalIndex: {
                console.log('Upserting global search index...');
                await upsertGlobalSearchIndex();
                break;
            }

            case Action.upsertTemplateIndex: {
                console.log(`Upserting search index of template "${templateId}"...`);
                await upsertChangedTemplateSearchIndex(templateId!);
                break;
            }

            case Action.deleteTemplateIndex: {
                console.log(`Deleting search index of template "${templateId}"...`);
                await deleteTemplateSearchIndex(templateId!);
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
