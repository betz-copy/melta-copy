import MockAdapter from 'axios-mock-adapter';

const mockEntites = (mock: MockAdapter) => {
    // Get entities by category
    mock.onPost('/api/instances/entities/search').reply(() => [
        200,
        {
            rows: [
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1ceb',
                        firstName: 'איילה',
                        lastName: 'נסיעות',
                        age: 40,
                        gender: false,
                        agentId: 'a1b2c3',
                        createdAt: new Date(3333, 10, 3),
                        updatedAt: new Date(4444, 10, 4),
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1cec',
                        firstName: 'ארנון',
                        lastName: 'פז',
                        age: 46,
                        gender: true,
                        agentId: 'd4e5f6',
                        createdAt: new Date(1111, 10, 1),
                        updatedAt: new Date(2222, 10, 2),
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1ced',
                        firstName: 'סקי',
                        lastName: 'דיל',
                        age: 35,
                        gender: true,
                        agentId: 'g7h8i9',
                        createdAt: new Date(5555, 10, 5),
                        updatedAt: new Date(6666, 10, 6),
                    },
                },
            ],
            lastRowIndex: 3,
        },
    ]);

    mock.onGet(/\/api\/instances\/entities\/[0-9a-fA-F]{24}\?expanded=true/).reply((config) => [
        200,
        {
            entity: {
                templateId: '61e3ea6e4d51a83e87e83c7f',
                properties: {
                    firstName: 'נועה',
                    lastName: 'קירל',
                    age: 20,
                    gender: false,
                    firstFile: 'blabla.docx',
                    _id: config.url!.split('/').at(-1)!.split('?')[0],
                    createdAt: new Date(1111, 10, 1),
                    updatedAt: new Date(2222, 10, 2),
                },
            },
            connections: [
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        properties: {
                            // todo: generated random ID. should I something else?
                            _id: '016B6f4a5aE2FeA62882f5C5',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        properties: {
                            name: 'טיול בר מצווה ללונדון',
                            destination: 'לונדון',
                            startDate: '2013-01-01',
                            endDate: '2013-01-10',
                            _id: '61e3ea6e4d51a82e87e83c7f',
                            createdAt: new Date(1111, 10, 1),
                            updatedAt: new Date(2222, 10, 2),
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e83c7c',
                        properties: {
                            _id: 'Fb5DbEa1Ad4bbaa8DbEd3Dd8',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c80',
                        properties: {
                            firstName: 'איילה',
                            lastName: 'נסיעות',
                            age: 40,
                            gender: false,
                            agentId: 'a1b2c3',
                            _id: '61e3ea6e4d51582e87e83c7f',
                            createdAt: new Date(2222, 10, 1),
                            updatedAt: new Date(3333, 10, 2),
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e43c7c',
                        properties: {
                            _id: '5Be45BAeA16d6Ab8df171E62',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c81',
                        properties: {
                            flightNumber: 'AA123',
                            departureDate: '2020-01-19T13:30:00.000Z',
                            landingDate: '2020-01-19T14:30:00.000Z',
                            from: 'NYC',
                            to: 'ORL',
                            planeType: 'B747-300',
                            _id: '61e3ea8e4d51a82e87e83c7f',
                            createdAt: new Date(1111, 2, 1),
                            updatedAt: new Date(2222, 2, 2),
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e43c7c',
                        properties: {
                            _id: 'c15dFBF79C300d7f4F61bF4f',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c81',
                        properties: {
                            flightNumber: 'ACA156',
                            departureDate: '2020-03-20T13:30:00.000Z',
                            landingDate: '2020-03-20T15:30:00.000Z',
                            from: 'TLV',
                            to: 'CYP',
                            planeType: 'A380-400',
                            _id: '61e3ea8e4d51a82e77e83c7f',
                            createdAt: new Date(2323, 10, 1),
                            updatedAt: new Date(2424, 10, 2),
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a23e87e43c7c',
                        properties: {
                            _id: '9aBA50AE3aeF36F0C0eab1B2',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la butique',
                            checkInDate: '2020-08-10',
                            checkOutDate: '2020-08-16',
                            country: 'קפריסין',
                            _id: '61e3ea8e4d51a82e77183c7f',
                            createdAt: new Date(1111, 12, 1),
                            updatedAt: new Date(1112, 10, 2),
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e3d51a83e87e43c7c',
                        properties: {
                            _id: '16b5ef0DaaF6CDF2ed624F12',
                        },
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c84',
                        properties: {
                            name: 'hara dira',
                            checkInDate: '2018-05-12',
                            checkOutDate: '2018-05-16',
                            country: 'שומקום',
                            _id: '61e32a8e4d51a82e77e83c7f',
                            createdAt: new Date(2345, 10, 1),
                            updatedAt: new Date(2346, 10, 2),
                        },
                    },
                },
            ],
        },
    ]);

    // Get specific entity
    mock.onGet(/\/api\/instances\/entities\/[0-9a-fA-F]{24}/).reply((config) => {
        return [
            200,
            {
                nodes: [
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        properties: {
                            name: 'סקי באיטליה',
                            destination: 'איטליה',
                            startDate: '2017-11-29',
                            endDate: '2017-12-05',
                            _id: config.url!.split('/')[3],
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c80',
                        properties: {
                            firstName: 'ארנון',
                            lastName: 'פז',
                            age: 46,
                            gender: true,
                            agentId: 'd4e5f6',
                            _id: '1001',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'גל',
                            lastName: 'גדות',
                            age: 35,
                            gender: false,
                            _id: '1002',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'בר',
                            lastName: 'רפאלי',
                            age: 36,
                            gender: false,
                            _id: '1003',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'סבא',
                            lastName: 'טוביה',
                            age: 76,
                            gender: true,
                            _id: '1004',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'אדיר',
                            lastName: 'מילר',
                            age: 43,
                            gender: true,
                            _id: '1005',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c89',
                        properties: {
                            company: 'ריקושט',
                            color: 'שחור',
                            weight: 21,
                            _id: '1006',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        properties: {
                            company: 'at&t',
                            number: 543458942,
                            _id: '1007',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        properties: {
                            company: 'vodaphone',
                            number: 1958535628,
                            _id: '1008',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        properties: {
                            model: 'גלקסי A70',
                            color: 'שחור',
                            serialNumber: '13941231231',
                            _id: '1009',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        properties: {
                            model: 'גלקסי S12',
                            color: 'לבן',
                            serialNumber: '12365431231',
                            _id: '1010',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la vie',
                            hotelChain: 'novo',
                            checkInDate: '2017-05-12',
                            checkOutDate: '2017-05-16',
                            country: 'צרפת',
                            _id: '1011',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la la',
                            checkInDate: '2013-04-02',
                            checkOutDate: '20173-04-09',
                            country: 'איטליה',
                            _id: '1012',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        properties: {
                            name: '159159159159159',
                            company: 'card',
                            expirtaionDate: '2026-01-19',
                            monthlyAmount: 6500,
                            _id: '1013',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        properties: {
                            name: '675676567656765',
                            company: 'visa',
                            expirtaionDate: '2026-02-22',
                            monthlyAmount: 6500,
                            _id: '1014',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c84',
                        properties: {
                            name: 'hara makom',
                            checkInDate: '2018-08-09',
                            checkOutDate: '2018-08-21',
                            country: 'משעמם',
                            _id: '1015',
                        },
                    },
                ],
                links: [
                    ...Array.from({ length: 10 }, () => {
                        return {
                            source: String(Math.floor(Math.random() * 14) + 1001),
                            target: String(Math.floor(Math.random() * 14) + 1001),
                            value: 1,
                        };
                    }),
                    ...Array.from({ length: 15 }, (_i, index) => {
                        return { source: config.url!.split('/')[3], target: String(index + 1001), value: 5 };
                    }),
                ],
            },
        ];
    });

    // Create
    mock.onPost('/api/instances/entities').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
        },
    ]);

    // Update
    mock.onPut(/\/api\/instances\/entities\/[0-9a-fA-F]{24}/).reply((config) => {
        return [
            200,
            {
                templateId: '61e3ea6e4d51a83e87e83c7f',
                properties: {
                    firstName: 'נועה',
                    lastName: 'קירללללל',
                    age: 20,
                    gender: false,
                    _id: config.url!.split('/')[2].split('?')[0],
                },
            },
        ];
    });

    // Delete
    mock.onDelete(/\/api\/instances\/entities\/[0-9a-fA-F]{24}/).reply(() => {
        return [200, {}];
    });
};

export { mockEntites };
