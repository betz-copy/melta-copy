import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IConstraint, IRequiredConstraint, IUniqueConstraint } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export const toastConstraintValidationError = (
    errorMetadata: { errorCode: string; constraint: Omit<IConstraint, 'constraintName'> },
    entityTemplate: IMongoEntityTemplatePopulated,
) => {
    const { constraint } = errorMetadata;
    console.log({ constraint });

    if (constraint.type === 'REQUIRED') {
        // shouldnt enter here. UI should block submit w/o required fields
        // but just for fun :)
        const { property } = constraint as Omit<IRequiredConstraint, 'constraintName'>;
        const { title: constraintPropertyDisplayName } = entityTemplate.properties.properties[property];
        toast.error(`${i18next.t('wizard.entity.missingInputForRequiredField')} "${constraintPropertyDisplayName}"`);
    } else {
        const { properties } = constraint as Omit<IUniqueConstraint, 'constraintName'>;
        const constraintPropsDisplayNames = properties.map((prop) => entityTemplate.properties.properties[prop].title);
        console.log({ constraintPropsDisplayNames });

        const constraintPropsListString = constraintPropsDisplayNames.map((prop) => `"${prop}"`).join('+');

        if (properties.length > 1) {
            toast.error(`${i18next.t('wizard.entity.someEntityAlreadyHasTheSameFields')} ${constraintPropsListString}`);
        } else {
            toast.error(`${i18next.t('wizard.entity.someEntityAlreadyHasTheSameField')} ${constraintPropsListString}`);
        }
    }
};
