// eslint-disable-next-line import/no-extraneous-dependencies
import { renderToString } from 'react-dom/server';
// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import config from '../../config';
import { IDeleteProcessNotificationMetadata, NotificationType } from '../../externalServices/notificationService/interfaces';
import { ActionTypes, RuleBreachRequestStatus } from '../../externalServices/ruleBreachService/interfaces';
import {
    IActionMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IRuleBreachAlertPopulated,
    IRuleBreachRequestPopulated,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
} from '../../externalServices/ruleBreachService/interfaces/populated';
import UsersManager from '../../express/users/manager';
import { hebrew } from './hebrew';
import { mailConfig } from './mailConfig';
import { IRule } from '../../express/templates/rules/interfaces';
import {
    IArchiveProcessNotificationMetadataPopulated,
    IDateAboutToExpireMetadataPopulated,
    INewProcessNotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
} from '../../externalServices/notificationService/interfaces/populated';
import { IMongoStepTemplate } from '../../externalServices/processService/interfaces/stepTemplate';
import {
    IMailNotification,
    IMailNotificationMetadataPopulated,
    IProcessReviewerUpdateMailNotificationMetadataPopulated,
    IProcessStatusUpdateMailNotificationMetadataPopulated,
} from './interfaces';
import { IEntity } from '../../externalServices/instanceService/interfaces/entities';
import { EntityTemplateManagerService, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipsTemplateService';

const { mailTitle } = mailConfig;
const {
    mailerService,
    service: { meltaBaseUrl },
} = config;

export const newProcessMail = ({ process }: INewProcessNotificationMetadataPopulated) => {
    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.newProcess.createNewProcess}</h3>
                <p>
                    {hebrew.newProcess.processName}
                    <strong>{process?.name}</strong>
                </p>
            </body>
        </html>
    );
};

export const deleteProcessMail = ({ processName }: IDeleteProcessNotificationMetadata) => {
    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.deleteProcess.deleteProcess}</h3>
                <p>
                    {hebrew.deleteProcess.theProcess}
                    <strong> {processName}</strong>
                    {hebrew.deleteProcess.deleteSuccessfully}
                </p>
            </body>
        </html>
    );
};

export const processStatusUpdateMail = ({ process, status: updateStatus, step }: IProcessStatusUpdateMailNotificationMetadataPopulated) => {
    return (
        <html>
            <body dir="rtl">
                <h3>
                    {hebrew.processStatusUpdate.updateStatus} {step ? hebrew.processStatusUpdate.step : hebrew.processStatusUpdate.process}
                </h3>

                {step ? (
                    <p>
                        {hebrew.processStatusUpdate.stepStatus} <strong>{step.displayName} </strong>
                        {hebrew.processStatusUpdate.inProcess}
                        <strong>{process?.name}</strong>
                    </p>
                ) : (
                    <p>
                        {hebrew.processStatusUpdate.processStatus} <strong>{process?.name}</strong>
                    </p>
                )}
                <p>
                    {hebrew.processStatusUpdate.updatedTo}
                    <strong>{hebrew.status[updateStatus]}</strong>
                </p>
            </body>
        </html>
    );
};

export const archiveProcessMail = ({ process, isArchived }: IArchiveProcessNotificationMetadataPopulated) => {
    return (
        <html>
            <body dir="rtl">
                <h3> {isArchived ? hebrew.archiveProcess.sendToArchive : hebrew.archiveProcess.removeFromArchive}</h3>
                <p>
                    {hebrew.archiveProcess.theProcess} <strong>{process?.name} </strong>
                    {isArchived ? hebrew.archiveProcess.sendToArchiveSuccessfully : hebrew.archiveProcess.removeFromArchiveSuccessfully}
                </p>
            </body>
        </html>
    );
};

export const processReviewerUpdateMail = ({
    process,
    addedSteps,
    deletedSteps,
    unchangedStepIds,
}: IProcessReviewerUpdateMailNotificationMetadataPopulated) => {
    const addedStepsData = addedSteps as IMongoStepTemplate[];
    const deletedStepsData = deletedSteps as IMongoStepTemplate[];
    if (!unchangedStepIds.length && !addedStepsData.length) {
        return (
            <html>
                <body dir="rtl">
                    <h3>{hebrew.processReviwerUpdate.processReviwerUpdate}</h3>
                    <p>
                        {hebrew.processReviwerUpdate.removeFromReviwersInProcess}
                        <strong> {process!.name}</strong>
                    </p>
                </body>
            </html>
        );
    }
    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.processReviwerUpdate.processReviwerUpdate}</h3>
                <div>
                    <p>
                        {hebrew.processReviwerUpdate.inProcess}
                        <strong> {process!.name}</strong>
                    </p>
                </div>
                {addedStepsData.length > 0 && (
                    <div>
                        <p style={{ textDecoration: 'underline' }}>
                            <u> {hebrew.processReviwerUpdate.addToReviwers}</u>
                        </p>
                        {addedStepsData.map((step, index) => (
                            <p key={index}>
                                <strong>- {step.displayName}</strong>
                            </p>
                        ))}
                    </div>
                )}

                {deletedStepsData.length > 0 && (
                    <div>
                        <p style={{ textDecoration: 'underline' }}>
                            <u> {hebrew.processReviwerUpdate.removeFromReviwers}</u>
                        </p>
                        {deletedStepsData.map((step) => (
                            <p>
                                <strong>- {step.displayName}</strong>
                            </p>
                        ))}
                    </div>
                )}
            </body>
        </html>
    );
};

const EntityLink: React.FC<{ entity: IEntity | null; entityTemplate: IMongoEntityTemplatePopulated | null }> = ({ entity, entityTemplate }) => {
    return (
        <a
            href={`${meltaBaseUrl}/entity/${entity ? entity.properties._id : 'unknownEntity'}`}
            target="_blank"
            style={{ color: '#225AA7', fontWeight: 'bold' }}
        >
            {entityTemplate ? entityTemplate.displayName : hebrew.ruleBreach.unknownEntity}
        </a>
    );
};

export const BrokenRulesMassage: React.FC<{ ruleBrokenData: IRule[] }> = ({ ruleBrokenData }) => {
    return (
        <>
            {ruleBrokenData.map((brokenRule) => (
                <p style={{ direction: 'rtl' }}>
                    <strong>* {brokenRule.name}</strong> - {brokenRule.description}
                </p>
            ))}
        </>
    );
};
export const getCreateOrDeleteRelActionInfo = async (
    actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship,
    { relationshipTemplateId, sourceEntity, destinationEntity }: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated,
) => {
    const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(relationshipTemplateId);
    const sourceEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(relationshipTemplate.sourceEntityId);
    const destinationEntityTemplate = await EntityTemplateManagerService.getEntityTemplateById(relationshipTemplate.destinationEntityId);
    return (
        <>
            {actionType === ActionTypes.CreateRelationship ? hebrew.ruleBreach.relationshipCreation : hebrew.ruleBreach.relationshipDeletion}
            <strong> {relationshipTemplate.displayName} </strong>
            {hebrew.ruleBreach.fromEntity} <EntityLink entity={sourceEntity} entityTemplate={sourceEntityTemplate!} />
            {hebrew.ruleBreach.toEntity} <EntityLink entity={destinationEntity} entityTemplate={destinationEntityTemplate!} />
        </>
    );
};
export const getUpdateEntityActionInfo = async ({ entity }: IUpdateEntityMetadataPopulated) => {
    const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity!.templateId);
    return (
        <p>
            {hebrew.updateEntityActionInfo.updatingEntity} <EntityLink entity={entity} entityTemplate={entityTemplate!} />
        </p>
    );
};

export const getUpdateEntityStatusActionInfo = async ({ entity, disabled }: IUpdateEntityStatusMetadataPopulated) => {
    const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity!.templateId);
    return (
        <p>
            {hebrew.updateEntityActionInfo.updatingEntityStatus} <EntityLink entity={entity} entityTemplate={entityTemplate!} />
            <strong>
                {disabled ? hebrew.ruleBreach.updateEntityStatusActionInfo.toDisabled : hebrew.ruleBreach.updateEntityStatusActionInfo.toActive}
            </strong>
        </p>
    );
};

export const getActionsInfoMessages = async (
    ruleBreach: IRuleBreachAlertPopulated<IActionMetadataPopulated> | IRuleBreachRequestPopulated<IActionMetadataPopulated>,
) => {
    return ruleBreach.actions.map((action) => {
        if (action.actionType === ActionTypes.CreateRelationship || action.actionType === ActionTypes.DeleteRelationship) {
            return getCreateOrDeleteRelActionInfo(
                action.actionType,
                action.actionMetadata as ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated,
            );
        }
        if (action.actionType === ActionTypes.UpdateEntity) {
            return getUpdateEntityActionInfo(action.actionMetadata as IUpdateEntityMetadataPopulated);
        }

        if (action.actionType === ActionTypes.UpdateStatus) {
            return getUpdateEntityStatusActionInfo(action.actionMetadata as IUpdateEntityStatusMetadataPopulated);
        }
        return null;
    });
};

const ruleBreachBodyMassage = async (
    ruleBreach:
        | IRuleBreachAlertPopulated<IActionMetadataPopulated>
        | IRuleBreachRequestPopulated<IActionMetadataPopulated>
        | IRuleBreachRequestPopulated<IActionMetadataPopulated>,
    ruleBrokenData: IRule[],
) => {
    return (
        <>
            {await getActionsInfoMessages(ruleBreach)}
            <p>
                {hebrew.ruleBreach.by}
                <strong>{ruleBreach.originUser.fullName}</strong>
            </p>
            <p>
                <u>{hebrew.brokenRules.breakingRules}</u>
            </p>
            <BrokenRulesMassage ruleBrokenData={ruleBrokenData} />
        </>
    );
};

export const ruleBreachAlertMail = async ({ alert: ruleBreachAlert }: IRuleBreachAlertNotificationMetadataPopulated) => {
    const ruleBrokenData = await Promise.all(
        ruleBreachAlert.brokenRules.map((brokenRule) => {
            return RelationshipsTemplateManagerService.getRuleById(brokenRule.ruleId);
        }),
    );

    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.ruleBreach.ruleBreachAlertTitle} </h3>
                <p>{hebrew.ruleBreach.note}</p>
                <div>{await ruleBreachBodyMassage(ruleBreachAlert, ruleBrokenData)}</div>
                <br />
                <p>
                    {hebrew.ruleBreach.moreDetails}
                    <a href={`${meltaBaseUrl}/rule-management/alert/${ruleBreachAlert._id}`} target="_blank">
                        {hebrew.ruleBreach.clickHere}
                    </a>
                </p>
            </body>
        </html>
    );
};

export const ruleBreachRequestMail = async ({ request: ruleBreachRequest }: IRuleBreachRequestNotificationMetadataPopulated) => {
    const ruleBrokenData = await Promise.all(
        ruleBreachRequest.brokenRules.map((brokenRule) => {
            return RelationshipsTemplateManagerService.getRuleById(brokenRule.ruleId);
        }),
    );

    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.ruleBreach.ruleBreachRequestTitle} </h3>
                <p>{hebrew.ruleBreach.RequestPendingApproval}</p>
                {await ruleBreachBodyMassage(ruleBreachRequest, ruleBrokenData)}

                <br />
                <p>
                    {hebrew.ruleBreach.moreDetails}
                    <a href={`${meltaBaseUrl}/rule-management/request/${ruleBreachRequest._id}`} target="_blank">
                        {hebrew.ruleBreach.clickHere}
                    </a>
                </p>
            </body>
        </html>
    );
};

export const ruleBreachResponseMail = async ({ request: ruleBreachRequest }: IRuleBreachResponseNotificationMetadataPopulated) => {
    const ruleBrokenData = await Promise.all(
        ruleBreachRequest.brokenRules.map((brokenRule) => {
            return RelationshipsTemplateManagerService.getRuleById(brokenRule.ruleId);
        }),
    );
    return (
        <html>
            <body dir="rtl">
                <h3>{hebrew.ruleBreach.ruleBreachResponseTitle} </h3>
                <p>{hebrew.ruleBreach.theRequestForAction}</p>
                {await ruleBreachBodyMassage(ruleBreachRequest, ruleBrokenData)}
                <p>
                    <strong>
                        {ruleBreachRequest.status === RuleBreachRequestStatus.Approved ? hebrew.ruleBreach.approved : hebrew.ruleBreach.denied}
                    </strong>
                    {hebrew.ruleBreach.by} <strong> {ruleBreachRequest.reviewer?.fullName}</strong>
                </p>
                <br />
                <p>
                    {hebrew.ruleBreach.moreDetails}
                    <a href={`${meltaBaseUrl}/rule-management/request/${ruleBreachRequest._id}`} target="_blank">
                        {hebrew.ruleBreach.clickHere}
                    </a>
                </p>
            </body>
        </html>
    );
};

export const dateAboutToExpireMail = async ({ entity, propertyName, datePropertyValue }: IDateAboutToExpireMetadataPopulated) => {
    const entityTemplate = await EntityTemplateManagerService.getEntityTemplateById(entity!.templateId);
    return (
        <html>
            <body dir="rtl">
                <p>{hebrew.dateAboutToExpireNotification.dateAboutToExpireHeadline}</p>
                <p>
                    {hebrew.dateAboutToExpireNotification.propertyValue}{' '}
                    <strong>
                        {new Date(datePropertyValue).toLocaleDateString('he-IL')}({entityTemplate?.properties.properties[propertyName].title})
                    </strong>
                    {hebrew.dateAboutToExpireNotification.entityTemplateName}
                    <EntityLink entity={entity} entityTemplate={entityTemplate!} /> {hebrew.dateAboutToExpireNotification.aboutToExpire}
                </p>
            </body>
        </html>
    );
};

export const getMailHtml = async (notificationType: string, data: IMailNotificationMetadataPopulated) => {
    switch (notificationType) {
        case NotificationType.ruleBreachAlert:
            return ruleBreachAlertMail(data as IRuleBreachAlertNotificationMetadataPopulated);
        case NotificationType.ruleBreachRequest:
            return ruleBreachRequestMail(data as IRuleBreachRequestNotificationMetadataPopulated);
        case NotificationType.ruleBreachResponse:
            return ruleBreachResponseMail(data as IRuleBreachResponseNotificationMetadataPopulated);
        case NotificationType.processReviewerUpdate:
            return processReviewerUpdateMail(data as IProcessReviewerUpdateMailNotificationMetadataPopulated);
        case NotificationType.processStatusUpdate:
            return processStatusUpdateMail(data as IProcessStatusUpdateMailNotificationMetadataPopulated);
        case NotificationType.newProcess:
            return newProcessMail(data as INewProcessNotificationMetadataPopulated);
        case NotificationType.dateAboutToExpire:
            return dateAboutToExpireMail(data as IDateAboutToExpireMetadataPopulated);
        case NotificationType.deleteProcess:
            return deleteProcessMail(data as IDeleteProcessNotificationMetadata);
        case NotificationType.archivedProcess:
            return archiveProcessMail(data as IArchiveProcessNotificationMetadataPopulated);
        default:
            return null;
    }
};
export async function createMail({ viewers: viewersId, type, populatedMetaData }: IMailNotification) {
    const viewersMailPromises = viewersId.map(async (viewerId: string) => {
        const viewer = await UsersManager.getUserById(viewerId);
        return viewer.mail;
    });
    const viewersMail = await Promise.all(viewersMailPromises);
    const title = mailTitle[type];

    const html = renderToString(await getMailHtml(type, populatedMetaData));
    return {
        from: mailerService.mailUser,
        to: viewersMail,
        title,
        html,
    };
}
