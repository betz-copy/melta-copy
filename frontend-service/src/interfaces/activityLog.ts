import { ActionsLog } from '@packages/activity-log';
import i18next from 'i18next';

export interface IActivityLogConfig {
    color: string;
    title: string;
    text: string;
}

const logColors: Record<ActionsLog, string> = {
    [ActionsLog.ACTIVATE_ENTITY]: '#C5FF7B',
    [ActionsLog.DISABLE_ENTITY]: '#B7B8B9',
    [ActionsLog.CREATE_ENTITY]: '#84FF90',
    [ActionsLog.DUPLICATE_ENTITY]: '#ffc4e9',
    [ActionsLog.CREATE_PROCESS]: '#84FF90',
    [ActionsLog.UPDATE_FIELDS]: '#8CCFFF',
    [ActionsLog.DELETE_RELATIONSHIP]: '#FF7979',
    [ActionsLog.CREATE_RELATIONSHIP]: '#FFD18C',
    [ActionsLog.VIEW_ENTITY]: '#C5FF7B',
    [ActionsLog.UPDATE_PROCESS]: '#8CCFFF',
    [ActionsLog.UPDATE_PROCESS_STEP]: '#8CCFFF',
    [ActionsLog.UPDATE_ENTITY]: '#8CCFFF',
};

const logTitles: Record<ActionsLog, string> = {
    [ActionsLog.ACTIVATE_ENTITY]: i18next.t('entityPage.activityLog.titles.enableEntity'),
    [ActionsLog.DISABLE_ENTITY]: i18next.t('entityPage.activityLog.titles.disableEntity'),
    [ActionsLog.CREATE_ENTITY]: i18next.t('entityPage.activityLog.titles.createEntity'),
    [ActionsLog.DUPLICATE_ENTITY]: i18next.t('entityPage.activityLog.titles.duplicateEntity'),
    [ActionsLog.CREATE_PROCESS]: i18next.t('entityPage.activityLog.titles.createProcess'),
    [ActionsLog.UPDATE_FIELDS]: i18next.t('entityPage.activityLog.titles.updateFields'),
    [ActionsLog.DELETE_RELATIONSHIP]: i18next.t('entityPage.activityLog.titles.deleteRelationship'),
    [ActionsLog.CREATE_RELATIONSHIP]: i18next.t('entityPage.activityLog.titles.createRelationship'),
    [ActionsLog.VIEW_ENTITY]: i18next.t('entityPage.activityLog.titles.viewEntity'),
    [ActionsLog.UPDATE_PROCESS]: i18next.t('entityPage.activityLog.titles.updateProcess'),
    [ActionsLog.UPDATE_PROCESS_STEP]: i18next.t('entityPage.activityLog.titles.updateProcessStep'),
    [ActionsLog.UPDATE_ENTITY]: i18next.t('entityPage.activityLog.titles.updateEntity'),
};

const logTexts: Record<ActionsLog, string> = {
    [ActionsLog.ACTIVATE_ENTITY]: i18next.t('entityPage.activityLog.activateEntity'),
    [ActionsLog.DISABLE_ENTITY]: i18next.t('entityPage.activityLog.disableEntity'),
    [ActionsLog.CREATE_ENTITY]: i18next.t('entityPage.activityLog.createEntity'),
    [ActionsLog.DUPLICATE_ENTITY]: i18next.t('entityPage.activityLog.duplicateEntity'),
    [ActionsLog.CREATE_PROCESS]: i18next.t('entityPage.activityLog.createProcess'),
    [ActionsLog.UPDATE_FIELDS]: i18next.t('entityPage.activityLog.updateFields'),
    [ActionsLog.DELETE_RELATIONSHIP]: i18next.t('entityPage.activityLog.deleteRelationship'),
    [ActionsLog.CREATE_RELATIONSHIP]: i18next.t('entityPage.activityLog.createRelationship'),
    [ActionsLog.VIEW_ENTITY]: i18next.t('entityPage.activityLog.viewEntity'),
    [ActionsLog.UPDATE_PROCESS]: i18next.t('entityPage.activityLog.updateProcess'),
    [ActionsLog.UPDATE_PROCESS_STEP]: i18next.t('entityPage.activityLog.updateProcessStep'),
    [ActionsLog.UPDATE_ENTITY]: i18next.t('entityPage.activityLog.updateEntity'),
};

export const activityLogConfigMap: Record<ActionsLog, IActivityLogConfig> = {
    [ActionsLog.ACTIVATE_ENTITY]: {
        color: logColors[ActionsLog.ACTIVATE_ENTITY],
        title: logTitles[ActionsLog.ACTIVATE_ENTITY],
        text: logTexts[ActionsLog.ACTIVATE_ENTITY],
    },
    [ActionsLog.DISABLE_ENTITY]: {
        color: logColors[ActionsLog.DISABLE_ENTITY],
        title: logTitles[ActionsLog.DISABLE_ENTITY],
        text: logTexts[ActionsLog.DISABLE_ENTITY],
    },
    [ActionsLog.CREATE_ENTITY]: {
        color: logColors[ActionsLog.CREATE_ENTITY],
        title: logTitles[ActionsLog.CREATE_ENTITY],
        text: logTexts[ActionsLog.CREATE_ENTITY],
    },
    [ActionsLog.DUPLICATE_ENTITY]: {
        color: logColors[ActionsLog.DUPLICATE_ENTITY],
        title: logTitles[ActionsLog.DUPLICATE_ENTITY],
        text: logTexts[ActionsLog.DUPLICATE_ENTITY],
    },
    [ActionsLog.CREATE_PROCESS]: {
        color: logColors[ActionsLog.CREATE_PROCESS],
        title: logTitles[ActionsLog.CREATE_PROCESS],
        text: logTexts[ActionsLog.CREATE_PROCESS],
    },
    [ActionsLog.UPDATE_FIELDS]: {
        color: logColors[ActionsLog.UPDATE_FIELDS],
        title: logTitles[ActionsLog.UPDATE_FIELDS],
        text: logTexts[ActionsLog.UPDATE_FIELDS],
    },
    [ActionsLog.DELETE_RELATIONSHIP]: {
        color: logColors[ActionsLog.DELETE_RELATIONSHIP],
        title: logTitles[ActionsLog.DELETE_RELATIONSHIP],
        text: logTexts[ActionsLog.DELETE_RELATIONSHIP],
    },
    [ActionsLog.CREATE_RELATIONSHIP]: {
        color: logColors[ActionsLog.CREATE_RELATIONSHIP],
        title: logTitles[ActionsLog.CREATE_RELATIONSHIP],
        text: logTexts[ActionsLog.CREATE_RELATIONSHIP],
    },
    [ActionsLog.VIEW_ENTITY]: {
        color: logColors[ActionsLog.VIEW_ENTITY],
        title: logTitles[ActionsLog.VIEW_ENTITY],
        text: logTexts[ActionsLog.VIEW_ENTITY],
    },
    [ActionsLog.UPDATE_PROCESS]: {
        color: logColors[ActionsLog.UPDATE_PROCESS],
        title: logTitles[ActionsLog.UPDATE_PROCESS],
        text: logTexts[ActionsLog.UPDATE_PROCESS],
    },
    [ActionsLog.UPDATE_PROCESS_STEP]: {
        color: logColors[ActionsLog.UPDATE_PROCESS_STEP],
        title: logTitles[ActionsLog.UPDATE_PROCESS_STEP],
        text: logTexts[ActionsLog.UPDATE_PROCESS_STEP],
    },
    [ActionsLog.UPDATE_ENTITY]: {
        color: logColors[ActionsLog.UPDATE_ENTITY],
        title: logTitles[ActionsLog.UPDATE_ENTITY],
        text: logTexts[ActionsLog.UPDATE_ENTITY],
    },
};
