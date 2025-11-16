import { IEntityWithIgnoredRules, IKartoffelUser, IMongoChildTemplatePopulated, IMongoEntityTemplatePopulated } from 'shared/dist';
import UsersManager from '../express/users/manager';

export const getUserFields = async (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    entities: IEntityWithIgnoredRules[] | undefined,
): Promise<Map<string, IKartoffelUser>> => {
    if (!entities) return new Map<string, IKartoffelUser>();

    const allIdentityCards: Set<string> = new Set<string>(
        Object.entries(template.properties.properties).flatMap(([key, value]) =>
            entities.flatMap((entity) => {
                const fieldValue = entity.properties[key];
                if (!fieldValue) return [];

                if (value?.format === 'user') return [fieldValue];
                if (value?.type === 'array' && value.items?.format === 'user') return Array.isArray(fieldValue) ? fieldValue : [fieldValue];

                return [];
            }),
        ),
    );

    if (!allIdentityCards.size) return new Map<string, IKartoffelUser>();
    const users: IKartoffelUser[] = await UsersManager.getUsersByIdentityCard([...allIdentityCards], true);

    return new Map<string, IKartoffelUser>(users.filter((user) => Boolean(user.identityCard)).map((user) => [user.identityCard!, user]));
};
