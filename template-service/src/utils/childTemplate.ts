import { getChildPropertiesFiltered, IChildTemplatePopulatedFromDb, IMongoChildTemplatePopulated } from '@packages/child-template';
import { IFullMongoEntityTemplate } from '@packages/entity-template';

const populateChildTemplateWithParent = (childTemplate: IChildTemplatePopulatedFromDb): IMongoChildTemplatePopulated => {
    const { parentTemplateId, ...child } = childTemplate;
    const { properties, ...parent } = parentTemplateId;

    const childPropertyKeys = Object.keys(child.properties.properties);

    const childProperties = getChildPropertiesFiltered(
        Object.fromEntries(
            Object.entries(properties.properties)
                .filter(([key]) => childPropertyKeys.includes(key))
                .map(([key, parentProp]) => {
                    const { defaultValue, filters, isEditableByUser, display } = child.properties.properties[key];
                    return [
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
                    ];
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
