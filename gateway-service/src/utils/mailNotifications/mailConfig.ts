import hebrew from './hebrew';

const mailConfig = {
    mailTitle: {
        ruleBreachAlert: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.ruleBreachAlert}`,
        ruleBreachRequest: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.ruleBreachRequest}`,
        ruleBreachResponse: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.ruleBreachResponse}`,
        processReviewerUpdate: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.processReviewerUpdate}`,
        processStatusUpdate: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.processStatusUpdate}`,
        newProcess: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.newProcess}`,
        dateAboutToExpire: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.dateAboutToExpire}`,
        deleteProcess: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.deleteProcess}`,
        archivedProcess: `${hebrew.titles.meltaNotificationTitlePrefix} ${hebrew.titles.archivedProcess}`,
    },
};

export default mailConfig;
