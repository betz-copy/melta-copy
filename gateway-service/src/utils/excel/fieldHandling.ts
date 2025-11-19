import {
    IChildTemplateProperty,
    IEntitySingleProperty,
    IKartoffelUser,
    IMongoChildTemplatePopulated,
    IMongoEntityTemplatePopulated,
    IProperties,
    NotFoundError,
    NotFoundErrorTypes,
} from '@microservices/shared';
import { UserNotFoundError } from '../../express/error';
import UsersManager from '../../express/users/manager';

const normalizeUser = (identityCard: string, usersMap: Map<string, IKartoffelUser>, key: string, allAttemptedIds: string[]): IKartoffelUser => {
    const user = usersMap.get(identityCard);
    if (!user)
        throw new NotFoundError('User not found', {
            type: NotFoundErrorTypes.userNotFound,
            property: key,
            attemptedIds: allAttemptedIds.filter((id) => !usersMap.get(id)),
        });

    return user;
};

const updateKartoffelFields = (
    user: IKartoffelUser,
    relatedFieldKey: string,
    templateProperties: IProperties['properties'] | Record<string, IEntitySingleProperty & IChildTemplateProperty>,
    entityProperties: Record<string, any>,
): void => {
    const kartoffelFields = Object.entries(templateProperties)
        .filter(([_key, value]) => value?.format === 'kartoffelUserField')
        .map(([key]) => key);

    for (const fieldKey of kartoffelFields) {
        const templateField = templateProperties[fieldKey];
        const relatedUserField = templateField.expandedUserField?.relatedUserField;
        const relatedKartoffelField = templateField.expandedUserField?.kartoffelField;

        if (relatedUserField === relatedFieldKey && relatedKartoffelField)
            entityProperties[fieldKey] = user[relatedKartoffelField] ?? entityProperties[fieldKey];
    }
};

export const handleUserFields = async (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    entityProperties: Record<string, any>,
    usersMap: Map<string, IKartoffelUser>,
): Promise<void> => {
    const templateProperties = template.properties.properties;

    const errors: UserNotFoundError[] = [];

    for (const [key, field] of Object.entries(templateProperties)) {
        const fieldValue = entityProperties[key];
        if (!fieldValue) continue;

        try {
            if (field?.format === 'user') {
                const user = normalizeUser(fieldValue, usersMap, key, [fieldValue]);
                updateKartoffelFields(user, key, templateProperties, entityProperties);

                entityProperties[key] = JSON.stringify(await UsersManager.kartoffelUserToUser(user));
                continue;
            }
            if (field?.type === 'array' && field?.items?.format === 'user') {
                const users: string[] = [];
                for (const identityCard of fieldValue) {
                    const kartoffelUser = normalizeUser(identityCard, usersMap, key, fieldValue);
                    const user = await UsersManager.kartoffelUserToUser(kartoffelUser);
                    users.push(JSON.stringify(user));
                }

                entityProperties[key] = users;
            }
        } catch (error) {
            if (error instanceof NotFoundError) errors.push(error);
            else throw error;
        }
    }

    if (errors.length) throw new AggregateError(errors, 'some user fields were not found');
};
