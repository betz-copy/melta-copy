import {
    getChildPropertiesFiltered,
    IChildTemplatePopulatedFromDb,
    IChildTemplateProperty,
    IMongoChildTemplatePopulated,
} from '@packages/child-template';
import { IUserField } from '@packages/entity';
import { IFullMongoEntityTemplate } from '@packages/entity-template';
import { IEntitySingleProperty } from '@packages/entity-template/dist';
import { IKartoffelUser } from '@packages/user';
import Kartoffel from '../externalServices/kartoffel';

const transformUser = (foundUser: IKartoffelUser): IUserField => ({
    _id: foundUser._id || foundUser.id!,
    fullName: foundUser.fullName!,
    jobTitle: foundUser.jobTitle,
    hierarchy: foundUser.hierarchy,
    mail: foundUser.mail,
    userType: foundUser.entityType,
});

const populateChildTemplateWithParent = async (childTemplate: IChildTemplatePopulatedFromDb): Promise<IMongoChildTemplatePopulated> => {
    const { parentTemplateId, ...child } = childTemplate;
    const { properties, ...parent } = parentTemplateId;

    const childPropertyKeys = Object.keys(child.properties.properties);

    const userIdToKey: Record<string, string> = {};
    const filteredProps: Array<[string, IChildTemplateProperty & IEntitySingleProperty]> = [];

    for (const [key, parentProp] of Object.entries(properties.properties)) {
        if (!childPropertyKeys.includes(key)) continue;
        const { defaultValue, filters, isEditableByUser, display } = child.properties.properties[key];
        if (defaultValue && parentProp.format === 'user') userIdToKey[defaultValue as string] = key;

        filteredProps.push([
            key,
            {
                ...parentProp,
                defaultValue,
                filters,
                isFilterByCurrentUser: child.filterByCurrentUserField === key,
                isFilterByUserUnit: child.filterByUnitUserField === key,
                isEditableByUser,
                display,
            },
        ]);
    }

    const userIdToUser: Record<string, IUserField> = {};
    if (Object.keys(userIdToKey).length) {
        const userIds = Object.keys(userIdToKey);
        const users = (await Kartoffel.getUsersByIds(userIds)).map(transformUser);
        users.forEach((user, idx) => {
            userIdToUser[userIds[idx]] = user;
        });
    }

    const childProperties = getChildPropertiesFiltered(
        Object.fromEntries(
            filteredProps.map(([key, prop]) => {
                if (prop.defaultValue && parentTemplateId.properties.properties[key].format === 'user') {
                    return [
                        key,
                        {
                            ...prop,
                            defaultValue: userIdToUser[prop.defaultValue] || undefined,
                        },
                    ];
                }
                return [key, prop];
            }),
        ),
    );

    if (parent.fieldGroups) {
        const childPropertiesKeys = Object.keys(childProperties);
        const childFieldGroups: Exclude<IFullMongoEntityTemplate['fieldGroups'], undefined> = [];

        for (let i = 0; i < parent.fieldGroups.length; i++) {
            const property = parent.fieldGroups[i].fields.find((field) => childPropertiesKeys.includes(field));

            if (property) childFieldGroups.push(parent.fieldGroups[i]);
        }

        parent.fieldGroups = childFieldGroups;
    }

    return {
        ...parent,
        ...child,
        parentTemplateId: parentTemplateId._id,
        parentTemplate: parentTemplateId,
        actions: child.actions || undefined,
        properties: {
            ...properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
    };
};

export default populateChildTemplateWithParent;
