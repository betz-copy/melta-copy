import { IMongoChildTemplatePopulated } from '@packages/child-template';
import { IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { IEntityWithIgnoredRules } from '@packages/rule-breach';
import { IKartoffelUser } from '@packages/user';
import UsersManager from '../express/users/manager';

export const getUserFields = async (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    entities: IEntityWithIgnoredRules[] | undefined,
): Promise<Map<string, IKartoffelUser>> => {
    if (!entities) return new Map<string, IKartoffelUser>();

    const allIdCards: string[] = Object.entries(template.properties.properties).flatMap(([key, value]) =>
        entities.flatMap((entity) => {
            const fieldValue = entity.properties[key];
            if (!fieldValue) return [];

            if (value?.format === 'user') return [fieldValue];
            if (value?.type === 'array' && value.items?.format === 'user') return Array.isArray(fieldValue) ? fieldValue : [fieldValue];

            return [];
        }),
    );

    const allUniqueIdCards: string[] = Array.from(new Set<string>(allIdCards));

    if (!allUniqueIdCards.length) return new Map<string, IKartoffelUser>();
    const users: IKartoffelUser[] = await UsersManager.getUsersByIdentityCard(allUniqueIdCards, true);

    return new Map<string, IKartoffelUser>(
        users.filter((user): user is typeof user & { identityCard: string } => Boolean(user.identityCard)).map((user) => [user.identityCard, user]),
    );
};
