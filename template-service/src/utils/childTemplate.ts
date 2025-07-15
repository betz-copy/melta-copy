import { getChildPropertiesFiltered, IChildTemplatePopulated, IChildTemplatePopulatedFromDb } from '@microservices/shared';

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
                    },
                ]),
        ),
    );

    return {
        ...parent,
        ...child,
        parentTemplate,
        properties: {
            ...properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
    };
};

export default populateChildTemplateWithParent;
