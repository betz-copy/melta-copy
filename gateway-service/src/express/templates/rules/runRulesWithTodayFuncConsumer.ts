import { ActionTypes, IBrokenRule, logger } from '@microservices/shared';
import { ConsumerMessage } from 'menashmq';
import config from '../../../config';
import InstancesService from '../../../externalServices/instanceService';
import RuleBreachesManager from '../../ruleBreaches/manager';

const {
    service: { workspaceIdHeaderName },
} = config;

export const runRulesWithTodayFunc = async (msg: ConsumerMessage) => {
    const workspaceId: string = msg.properties.headers[workspaceIdHeaderName];

    const instancesService = new InstancesService(workspaceId);

    try {
        await instancesService.runRulesWithTodayFunc();

        msg.ack();
    } catch (error) {
        msg.nack(false);
        logger.error('Error running rules with today function', { error, workspaceId });
    }
};

export const createRuleBreachAlertQueue = async (msg: ConsumerMessage) => {
    const workspaceId: string = msg.properties.headers[workspaceIdHeaderName];
    const ruleBreachesManager = new RuleBreachesManager(workspaceId);

    const brokenRule = msg.getContent() as IBrokenRule;

    try {
        await ruleBreachesManager.createRuleBreachAlert(
            {
                brokenRules: [brokenRule],
                actions: [
                    {
                        actionType: ActionTypes.CronjobRun,
                        // cronjob run is shown as trigggered per entity.
                        actionMetadata: { entityId: brokenRule.failures[0].entityId },
                    },
                ],
            },
            null,
        );

        msg.ack();
    } catch (error) {
        msg.nack(false);
        logger.error('Error creating rule breach alert for rule with today function', { error, workspaceId, brokenRule });
    }
};
