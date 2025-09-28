import Handlebars from 'handlebars';
import { formatEntityPropertiesToString, IEntity, IMongoEntityTemplate, IRuleMail } from '@microservices/shared';
import { IRuleFailure } from '../express/rules/interfaces';

export const injectValuesToString = (template: string, properties: Record<string, any>, entityTemplate: IMongoEntityTemplate) => {
    const compiledTemplate = Handlebars.compile(template);
    const formatted = formatEntityPropertiesToString(entityTemplate, properties);
    const injected = compiledTemplate(formatted);

    return injected;
};

export const extractEmailsFromRules = (indicatorRules: IRuleFailure[], entity: IEntity, entityTemplate: IMongoEntityTemplate): IRuleMail[] => {
    return indicatorRules.flatMap((rule) => {
        if (!rule.rule.mail?.display) return [];

        const mailTemplate = rule.rule.mail;
        return [
            {
                ...mailTemplate,
                title: injectValuesToString(mailTemplate.title, entity.properties, entityTemplate),
                body: injectValuesToString(mailTemplate.body, entity.properties, entityTemplate),
            },
        ];
    });
};
