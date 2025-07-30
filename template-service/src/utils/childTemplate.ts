import { getChildPropertiesFiltered, IChildTemplatePopulated, IChildTemplatePopulatedFromDb, IFullMongoEntityTemplate } from '@microservices/shared';

const populateChildTemplateWithParent = (childTemplate: IChildTemplatePopulatedFromDb): IChildTemplatePopulated => {
    const { parentTemplateId: parentTemplate, ...child } = childTemplate;
    const { properties, ...parent } = parentTemplate;

    const childPropertyKeys = Object.keys(child.properties.properties);

    const childProperties = getChildPropertiesFiltered(
        Object.fromEntries(
            Object.entries(properties.properties)
                .filter(([key]) => childPropertyKeys.includes(key))
                .map(([key, parentProp]) => [
                    key,
                    {
                        ...parentProp,
                        defaultValue: child.properties.properties[key].defaultValue,
                        filters: child.properties.properties[key].filters,
                        isFilterByCurrentUser: child.filterByCurrentUserField === key,
                        isFilterByUserUnit: child.filterByUnitUserField === key,
                        isEditableByUser: child.properties.properties[key].isEditableByUser,
                        display: child.properties.properties[key].display,
                    },
                ]),
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
        parentTemplate,
        actions: child.actions || undefined,
        properties: {
            ...properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
    };
};

export default populateChildTemplateWithParent;
