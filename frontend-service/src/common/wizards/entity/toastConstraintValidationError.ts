import i18next from 'i18next';
import { QueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IConstraint, IRequiredConstraint, IUniqueConstraint } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';

export const toastConstraintValidationError = (
    queryClient: QueryClient,
    errorMetadata: { errorCode: string; constraint: Omit<IConstraint, 'constraintName'> },
) => {
    const { constraint } = errorMetadata;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(constraint.templateId)!;

    if (constraint.type === 'REQUIRED') {
        // shouldnt enter here. UI should block submit w/o required fields
        // but just for fun :)
        const { property } = constraint as Omit<IRequiredConstraint, 'constraintName'>;
        const { title: constraintPropertyDisplayName } = entityTemplate.properties.properties[property];
        toast.error(`${i18next.t('wizard.entity.missingInputForRequiredField')} "${constraintPropertyDisplayName}"`);
    } else {
        const { properties } = constraint as Omit<IUniqueConstraint, 'constraintName'>;
        const constraintPropsDisplayNames = properties.map((prop) => entityTemplate.properties.properties[prop].title);

        const constraintPropsListString = constraintPropsDisplayNames.map((prop) => `"${prop}"`).join('+');

        if (properties.length > 1) {
            toast.error(`${i18next.t('wizard.entity.someEntityAlreadyHasTheSameFields')} ${constraintPropsListString}`);
        } else {
            toast.error(`${i18next.t('wizard.entity.someEntityAlreadyHasTheSameField')} ${constraintPropsListString}`);
        }
    }
};
