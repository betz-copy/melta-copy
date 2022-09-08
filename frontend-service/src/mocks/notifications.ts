/* eslint-disable import/no-extraneous-dependencies */
import { Chance } from 'chance';
import MockAdapter from 'axios-mock-adapter';
import { generateMongoId } from './permissions';
import { INotificationPopulated, NotificationType } from '../interfaces/notifications';
import { generateRuleBreachAlert, generateRuleBreachRequest } from './ruleBreaches';

const chance = new Chance();

const generateNotification = (): INotificationPopulated => {
    const type = chance.pickone([NotificationType.ruleBreachAlert, NotificationType.ruleBreachRequest, NotificationType.ruleBreachResponse]);

    let metadata: INotificationPopulated['metadata'];

    switch (type) {
        case NotificationType.ruleBreachAlert:
            metadata = { alert: generateRuleBreachAlert() };
            break;
        case NotificationType.ruleBreachRequest:
            metadata = { request: generateRuleBreachRequest() };
            break;
        case NotificationType.ruleBreachResponse:
            metadata = { request: generateRuleBreachRequest(true) };
            break;
        default:
            throw new Error('unsupported notification type');
    }

    return {
        type,
        metadata,
        createdAt: new Date(),
        _id: generateMongoId(),
    };
};

const myNotifications: INotificationPopulated[] = [];

for (let i = 0; i < chance.integer({ min: 1, max: 200 }); i += 1) {
    myNotifications.push(generateNotification());
}

export const mockNotifications = (mock: MockAdapter) => {
    mock.onGet('/api/notifications/my/count').reply(() => {
        return [200, myNotifications.length];
    });

    mock.onGet('/api/notifications/my').reply((data) => {
        const { step = 0, limit } = data.params;
        const skip = step * limit;

        return [200, myNotifications.slice(skip, limit + skip)];
    });

    mock.onPatch(/\/api\/notifications\/.*\/seen/).reply((data) => {
        const id = data.url?.split('notifications/')[1].split('/seen')[0];

        const notificationIndex = myNotifications.findIndex((notification) => notification._id === id);
        myNotifications.splice(notificationIndex, 1);

        return [200, myNotifications];
    });
};
