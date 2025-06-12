export const getTrimmedValueAggregation = [
    {
        $set: {
            'properties.properties': {
                $map: {
                    input: { $objectToArray: '$properties.properties' },
                    as: 'property',
                    in: {
                        $cond: {
                            if: {
                                $and: [{ $ne: ['$$property.v.enum', null] }, { $isArray: '$$property.v.enum' }],
                            },
                            then: { k: '$$property.k', v: false },
                            else: {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ['$$property.v.items', null] },
                                            { $ne: ['$$property.v.items.enum', null] },
                                            { $isArray: '$$property.v.items.enum' },
                                        ],
                                    },
                                    then: { k: '$$property.k', v: true },
                                    else: {},
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    {
        $set: {
            property: {
                $filter: {
                    input: '$properties.properties',
                    as: 'property',
                    cond: { $ne: ['$$property', {}] },
                },
            },
        },
    },
    { $match: { property: { $ne: [] } } },
    {
        $project: {
            name: true,
            displayName: true,
            property: true,
        },
    },
];

export const trimValuesInMongoAggregation = [
    {
        $set: {
            'properties.properties': {
                $map: {
                    input: {
                        $objectToArray: '$properties.properties',
                    },
                    as: 'property',
                    in: {
                        k: '$$property.k',
                        v: {
                            $mergeObjects: [
                                '$$property.v',
                                {
                                    $cond: {
                                        if: {
                                            $and: [{ $ne: ['$$property.v.enum', null] }, { $isArray: '$$property.v.enum' }],
                                        },
                                        then: {
                                            enum: {
                                                $map: {
                                                    input: '$$property.v.enum',
                                                    as: 'enumValue',
                                                    in: { $trim: { input: '$$enumValue' } },
                                                },
                                            },
                                        },
                                        else: {},
                                    },
                                },
                                {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $ne: ['$$property.v.items', null] },
                                                { $ne: ['$$property.v.items.enum', null] },
                                                { $isArray: '$$property.v.items.enum' },
                                            ],
                                        },
                                        then: {
                                            items: {
                                                type: '$$property.v.items.type', // Added type field here
                                                enum: {
                                                    $map: {
                                                        input: '$$property.v.items.enum',
                                                        as: 'itemEnumValue',
                                                        in: { $trim: { input: '$$itemEnumValue' } },
                                                    },
                                                },
                                            },
                                        },
                                        else: {},
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    },
    {
        $set: {
            'properties.properties': {
                $arrayToObject: '$properties.properties',
            },
        },
    },
];
