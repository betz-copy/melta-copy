import {
    ActionTypes,
    IArchiveProcessNotificationMetadataPopulated,
    ICreateOrDuplicateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDateAboutToExpireMetadataPopulated,
    IDeleteProcessNotificationMetadata,
    IDeleteRelationshipMetadataPopulated,
    IEntity,
    IMongoEntityTemplatePopulated,
    IMongoStepTemplate,
    INewProcessNotificationMetadataPopulated,
    IRule,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachAlertPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachRequestPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
    IRuleMail,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
    NotificationType,
    RuleBreachRequestStatus,
} from '@microservices/shared';
import React from 'react';
import { renderToString } from 'react-dom/server';
import config from '../../config';
import WorkspaceManager from '../../express/workspaces/manager';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import hebrew from './hebrew';
import {
    IMailNotification,
    IMailNotificationMetadataPopulated,
    IProcessReviewerUpdateMailNotificationMetadataPopulated,
    IProcessStatusUpdateMailNotificationMetadataPopulated,
} from './interfaces';
import mailConfig from './mailConfig';

const { mailTitle } = mailConfig;
const { mailerService } = config;

class MailManager {
    private entityTemplateService: EntityTemplateService;

    private instanceService: InstancesService;

    private relationshipsTemplateService: RelationshipsTemplateService;

    constructor(private workspaceId: string) {
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instanceService = new InstancesService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
    }

    private async newProcessMail({ process }: INewProcessNotificationMetadataPopulated) {
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
    }

    private deleteProcessMail({ processName }: IDeleteProcessNotificationMetadata) {
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
    }

    private processStatusUpdateMail({ process, status: updateStatus, step }: IProcessStatusUpdateMailNotificationMetadataPopulated) {
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
    }

    private archiveProcessMail({ process, isArchived }: IArchiveProcessNotificationMetadataPopulated) {
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
    }

    private processReviewerUpdateMail({
        process,
        addedSteps,
        deletedSteps,
        unchangedStepIds,
    }: IProcessReviewerUpdateMailNotificationMetadataPopulated) {
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
    }

    private EntityLink({
        entity,
        entityTemplate,
        baseUrl,
    }: {
        entity: IEntity | string | null;
        entityTemplate: IMongoEntityTemplatePopulated | null;
        baseUrl: string;
    }) {
        const entityId = entity && typeof entity !== 'string' ? entity.properties._id : 'unknownEntity';
        const displayName = entityTemplate ? entityTemplate.displayName : hebrew.ruleBreach.unknownEntity;

        return (
            <a href={`${baseUrl}/entity/${entityId}`} target="_blank" style={{ color: '#225AA7', fontWeight: 'bold' }}>
                {displayName}
            </a>
        );
    }

    private BrokenRulesMassage({ ruleBrokenData }: { ruleBrokenData: IRule[] }) {
        return (
            <>
                {ruleBrokenData.map((brokenRule) => (
                    <p style={{ direction: 'rtl' }}>
                        <strong>* {brokenRule.name}</strong> - {brokenRule.description}
                    </p>
                ))}
            </>
        );
    }

    private async getCreateOrDeleteRelActionInfo(
        actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship,
        { relationshipTemplateId, sourceEntity, destinationEntity }: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated,
    ) {
        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(relationshipTemplateId);
        const sourceEntityTemplate = await this.entityTemplateService.getEntityTemplateById(relationshipTemplate.sourceEntityId);
        const destinationEntityTemplate = await this.entityTemplateService.getEntityTemplateById(relationshipTemplate.destinationEntityId);
        const baseUrl = await WorkspaceManager.getBaseUrl(this.workspaceId);

        return (
            <>
                {actionType === ActionTypes.CreateRelationship ? hebrew.ruleBreach.relationshipCreation : hebrew.ruleBreach.relationshipDeletion}{' '}
                <strong> {relationshipTemplate.displayName} </strong>
                {hebrew.ruleBreach.fromEntity} <this.EntityLink entity={sourceEntity} entityTemplate={sourceEntityTemplate!} baseUrl={baseUrl} />
                {hebrew.ruleBreach.toEntity}
                <this.EntityLink entity={destinationEntity} entityTemplate={destinationEntityTemplate!} baseUrl={baseUrl} />
            </>
        );
    }

    private async getUpdateEntityActionInfo({ entity }: IUpdateEntityMetadataPopulated) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity!.templateId);
        const baseUrl = await WorkspaceManager.getBaseUrl(this.workspaceId);

        return (
            <p>
                {hebrew.updateEntityActionInfo.updatingEntity} <this.EntityLink entity={entity} entityTemplate={entityTemplate!} baseUrl={baseUrl} />
            </p>
        );
    }

    private async getCreatedOrDuplicateEntityActionInfo({ templateId, properties }, actionType: string) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(templateId);
        const baseUrl = await WorkspaceManager.getBaseUrl(this.workspaceId);
        const entity = await this.instanceService.getEntityInstanceById(properties._id);

        return (
            <p>
                {hebrew.updateEntityActionInfo[actionType === ActionTypes.CreateEntity ? 'createEntity' : 'duplicateEntity']}{' '}
                <this.EntityLink entity={entity} entityTemplate={entityTemplate!} baseUrl={baseUrl} />
            </p>
        );
    }

    private async getUpdateEntityStatusActionInfo({ entity, disabled }: IUpdateEntityStatusMetadataPopulated) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity!.templateId);
        const baseUrl = await WorkspaceManager.getBaseUrl(this.workspaceId);

        return (
            <p>
                {hebrew.updateEntityActionInfo.updatingEntityStatus}{' '}
                <this.EntityLink entity={entity} entityTemplate={entityTemplate!} baseUrl={baseUrl} />
                <strong>
                    {disabled ? hebrew.ruleBreach.updateEntityStatusActionInfo.toDisabled : hebrew.ruleBreach.updateEntityStatusActionInfo.toActive}
                </strong>
            </p>
        );
    }

    private async getActionsInfoMessages(ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated) {
        return Promise.all(
            ruleBreach.actions.map((action) => {
                switch (action.actionType) {
                    case ActionTypes.CreateRelationship:
                    case ActionTypes.DeleteRelationship:
                        return this.getCreateOrDeleteRelActionInfo(
                            action.actionType,
                            action.actionMetadata as ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated,
                        );
                    case ActionTypes.CreateEntity:
                    case ActionTypes.DuplicateEntity:
                        return this.getCreatedOrDuplicateEntityActionInfo(
                            action.actionMetadata as ICreateOrDuplicateEntityMetadataPopulated,
                            action.actionType,
                        );
                    case ActionTypes.UpdateEntity:
                        return this.getUpdateEntityActionInfo(action.actionMetadata as IUpdateEntityMetadataPopulated);
                    case ActionTypes.UpdateStatus:
                        return this.getUpdateEntityStatusActionInfo(action.actionMetadata as IUpdateEntityStatusMetadataPopulated);
                    default:
                        return null;
                }
            }),
        );
    }

    private async ruleBreachBodyMassage(
        ruleBreach: IRuleBreachAlertPopulated | IRuleBreachRequestPopulated | IRuleBreachRequestPopulated,
        ruleBrokenData: IRule[],
    ) {
        return (
            <>
                {await this.getActionsInfoMessages(ruleBreach)}
                <p>
                    {hebrew.ruleBreach.by}
                    <strong>{ruleBreach.originUser.fullName}</strong>
                </p>
                <p>
                    <u>{hebrew.brokenRules.breakingRules}</u>
                </p>
                <this.BrokenRulesMassage ruleBrokenData={ruleBrokenData} />
            </>
        );
    }

    private async ruleBreachAlertMail({ alert: ruleBreachAlert }: IRuleBreachAlertNotificationMetadataPopulated) {
        const ruleBrokenData = await Promise.all(
            ruleBreachAlert.brokenRules.map((brokenRule) => {
                return this.relationshipsTemplateService.getRuleById(brokenRule.ruleId);
            }),
        );

        return (
            <html>
                <body dir="rtl">
                    <h3>{hebrew.ruleBreach.ruleBreachAlertTitle} </h3>
                    <p>{hebrew.ruleBreach.note}</p>
                    <div>{await this.ruleBreachBodyMassage(ruleBreachAlert, ruleBrokenData)}</div>
                    <br />
                    <p>
                        {hebrew.ruleBreach.moreDetails}
                        <a
                            href={`${await WorkspaceManager.getBaseUrl(this.workspaceId)}/rule-management/alert/${ruleBreachAlert._id}`}
                            target="_blank"
                        >
                            {hebrew.ruleBreach.clickHere}
                        </a>
                    </p>
                </body>
            </html>
        );
    }

    private async ruleBreachRequestMail({ request: ruleBreachRequest }: IRuleBreachRequestNotificationMetadataPopulated) {
        const ruleBrokenData = await Promise.all(
            ruleBreachRequest.brokenRules.map((brokenRule) => {
                return this.relationshipsTemplateService.getRuleById(brokenRule.ruleId);
            }),
        );

        return (
            <html>
                <body dir="rtl">
                    <h3>{hebrew.ruleBreach.ruleBreachRequestTitle} </h3>
                    <p>{hebrew.ruleBreach.RequestPendingApproval}</p>
                    {await this.ruleBreachBodyMassage(ruleBreachRequest, ruleBrokenData)}

                    <br />
                    <p>
                        {hebrew.ruleBreach.moreDetails}
                        <a
                            href={`${await WorkspaceManager.getBaseUrl(this.workspaceId)}/rule-management/request/${ruleBreachRequest._id}`}
                            target="_blank"
                        >
                            {hebrew.ruleBreach.clickHere}
                        </a>
                    </p>
                </body>
            </html>
        );
    }

    private async ruleBreachResponseMail({ request: ruleBreachRequest }: IRuleBreachResponseNotificationMetadataPopulated) {
        const ruleBrokenData = await Promise.all(
            ruleBreachRequest.brokenRules.map((brokenRule) => {
                return this.relationshipsTemplateService.getRuleById(brokenRule.ruleId);
            }),
        );
        return (
            <html>
                <body dir="rtl">
                    <h3>{hebrew.ruleBreach.ruleBreachResponseTitle} </h3>
                    <p>{hebrew.ruleBreach.theRequestForAction}</p>
                    {await this.ruleBreachBodyMassage(ruleBreachRequest, ruleBrokenData)}
                    <p>
                        <strong>
                            {ruleBreachRequest.status === RuleBreachRequestStatus.Approved ? hebrew.ruleBreach.approved : hebrew.ruleBreach.denied}
                        </strong>
                        {hebrew.ruleBreach.by} <strong> {ruleBreachRequest.reviewer?.fullName}</strong>
                    </p>
                    <br />
                    <p>
                        {hebrew.ruleBreach.moreDetails}
                        <a
                            href={`${await WorkspaceManager.getBaseUrl(this.workspaceId)}/rule-management/request/${ruleBreachRequest._id}`}
                            target="_blank"
                        >
                            {hebrew.ruleBreach.clickHere}
                        </a>
                    </p>
                </body>
            </html>
        );
    }

    private async dateAboutToExpireMail({ entity, propertyName, datePropertyValue }: IDateAboutToExpireMetadataPopulated) {
        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(entity!.templateId);
        const baseUrl = await WorkspaceManager.getBaseUrl(this.workspaceId);

        return (
            <html>
                <body dir="rtl">
                    <p>{hebrew.dateAboutToExpireNotification.dateAboutToExpireHeadline}</p>
                    <p>
                        {hebrew.dateAboutToExpireNotification.propertyValue}
                        <strong>
                            {new Date(datePropertyValue).toLocaleDateString('he-IL')}({entityTemplate?.properties.properties[propertyName].title})
                        </strong>
                        {hebrew.dateAboutToExpireNotification.entityTemplateName}
                        <this.EntityLink entity={entity} entityTemplate={entityTemplate!} baseUrl={baseUrl} />
                        {hebrew.dateAboutToExpireNotification.aboutToExpire}
                    </p>
                </body>
            </html>
        );
    }

    private async getMailHtml(notificationType: string, data: IMailNotificationMetadataPopulated) {
        switch (notificationType) {
            case NotificationType.ruleBreachAlert:
                return this.ruleBreachAlertMail(data as IRuleBreachAlertNotificationMetadataPopulated);
            case NotificationType.ruleBreachRequest:
                return this.ruleBreachRequestMail(data as IRuleBreachRequestNotificationMetadataPopulated);
            case NotificationType.ruleBreachResponse:
                return this.ruleBreachResponseMail(data as IRuleBreachResponseNotificationMetadataPopulated);
            case NotificationType.processReviewerUpdate:
                return this.processReviewerUpdateMail(data as IProcessReviewerUpdateMailNotificationMetadataPopulated);
            case NotificationType.processStatusUpdate:
                return this.processStatusUpdateMail(data as IProcessStatusUpdateMailNotificationMetadataPopulated);
            case NotificationType.newProcess:
                return this.newProcessMail(data as INewProcessNotificationMetadataPopulated);
            case NotificationType.dateAboutToExpire:
                return this.dateAboutToExpireMail(data as IDateAboutToExpireMetadataPopulated);
            case NotificationType.deleteProcess:
                return this.deleteProcessMail(data as IDeleteProcessNotificationMetadata);
            case NotificationType.archivedProcess:
                return this.archiveProcessMail(data as IArchiveProcessNotificationMetadataPopulated);
            default:
                return null;
        }
    }

    async createMail({ viewersMail, type, populatedMetaData }: IMailNotification, emailTemplate?: IRuleMail) {
        if (type === NotificationType.ruleIndicatorAlert) {
            return {
                from: mailerService.mailUser,
                to: viewersMail,
                title: emailTemplate!.title,
                html: emailTemplate!.body,
            };
        }

        const title = mailTitle[type];
        const html = renderToString((await this.getMailHtml(type, populatedMetaData)) || <></>);

        return {
            from: mailerService.mailUser,
            to: viewersMail,
            title,
            html,
        };
    }
}

export default MailManager;
