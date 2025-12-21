import { IEntity } from '@packages/entity';
import { IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { IRuleMail } from '@packages/rule';
import Handlebars from 'handlebars';
import formatEntityPropertiesToString from './formatEntityProperties';

export const injectValuesToString = (
    template: string,
    properties: Record<string, any>,
    entityTemplate: IMongoEntityTemplatePopulated,
    relatedTemplates?: Map<string, IMongoEntityTemplatePopulated>,
    baseUrl?: string,
    workspaceId?: string,
    allowLink: boolean = false,
) => {
    const compiledTemplate = Handlebars.compile(template, { noEscape: true });
    const formatted = formatEntityPropertiesToString(entityTemplate, properties, relatedTemplates, baseUrl, workspaceId, allowLink);
    const injected = compiledTemplate(formatted);

    return injected;
};

export const injectValuesToEmails = (
    emails: IRuleMail[],
    entity: IEntity,
    entityTemplate: IMongoEntityTemplatePopulated,
    relatedTemplates: Map<string, IMongoEntityTemplatePopulated>,
    baseUrl: string,
    workspaceId: string,
): IRuleMail[] => {
    return emails.map((email) => ({
        ...email,
        title: injectValuesToString(email.title, entity.properties, entityTemplate, relatedTemplates),
        body: injectValuesToString(email.body, entity.properties, entityTemplate, relatedTemplates, baseUrl, workspaceId, true),
    }));
};
