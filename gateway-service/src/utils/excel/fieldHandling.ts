import { UserNotFoundError } from 'gateway-service/src/express/error';
import UsersManager from 'gateway-service/src/express/users/manager';
import {
    IExternalUser,
    IKartoffelUser,
    IMongoChildTemplatePopulated,
    IMongoEntityTemplatePopulated,
    NotFoundError,
    NotFoundErrorTypes,
} from 'shared/dist';

function normalizeUser(identityCard: string, usersMap: Map<string, IKartoffelUser>, key: string, allAttemptedIds: string[]): IKartoffelUser {
    const user: IKartoffelUser | undefined = usersMap.get(identityCard);
    if (!user)
        throw new NotFoundError('User not found', {
            type: NotFoundErrorTypes.userNotFound,
            property: key,
            attemptedIds: allAttemptedIds.filter((id) => !usersMap.get(id)),
        });

    return user;
}

export async function handleUserFields(
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    entityProperties: Record<string, any>,
    usersMap: Map<string, IKartoffelUser>,
): Promise<void> {
    const templateProperties = template.properties.properties;
    const kartoffelFields: string[] = Object.entries(templateProperties)
        .filter(([_key, value]) => value?.format === 'kartoffelUserField')
        .map(([key]) => key);

    const errors: UserNotFoundError[] = [];

    const updateKartoffelFields = (user: IKartoffelUser, relatedFieldKey: string): void => {
        for (const fieldKey of kartoffelFields) {
            const templateField = templateProperties[fieldKey];
            const relatedUserField: string | undefined = templateField.expandedUserField?.relatedUserField;
            const relatedKartoffelField: string | undefined = templateField.expandedUserField?.kartoffelField;

            if (relatedUserField === relatedFieldKey && relatedKartoffelField)
                entityProperties[fieldKey] = user[relatedKartoffelField as keyof IKartoffelUser] ?? entityProperties[fieldKey];
        }
    };

    for (const [key, field] of Object.entries(templateProperties)) {
        const fieldValue = entityProperties[key];
        if (!fieldValue) continue;

        try {
            if (field?.format === 'user') {
                const user: IKartoffelUser = normalizeUser(fieldValue, usersMap, key, [fieldValue]);
                updateKartoffelFields(user, key);

                entityProperties[key] = JSON.stringify(await UsersManager.kartoffelUserToUser(user));
                continue;
            }
            if (field?.type === 'array' && field?.items?.format === 'user') {
                const users: string[] = [];
                for (const identityCard of fieldValue as string[]) {
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
}
