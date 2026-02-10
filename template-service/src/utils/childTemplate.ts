import {
    getChildPropertiesFiltered,
    IChildTemplatePopulatedFromDb,
    IChildTemplateProperty,
    IMongoChildTemplatePopulated,
} from '@packages/child-template';
import { serializeUser } from '@packages/entity';
import { IEntitySingleProperty, IFullMongoEntityTemplate } from '@packages/entity-template';
import Kartoffel from '../externalServices/kartoffel';

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

    const userIds = Object.keys(userIdToKey);
    const users = (await Kartoffel.getUsersByIds(userIds)).map(serializeUser);

    const childProperties = getChildPropertiesFiltered(
        Object.fromEntries(
            filteredProps.map(([key, prop]) => {
                if (prop.defaultValue && parentTemplateId.properties.properties[key].format === 'user') {
                    return [
                        key,
                        {
                            ...prop,
                            defaultValue: users.find((user) => user._id === prop.defaultValue),
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
