import MockAdapter from 'axios-mock-adapter';

const mockActivityLog = (mock: MockAdapter) => {
    mock.onGet(/\/api\/activity-log\/[0-9a-fA-F]{24}/, { params: { skip: undefined, limit: 10 } }).reply(() => [
        200,
        [
            {
                _id: '61e7ea2e4251a83e87e83c7e',
                timestamp: new Date(2021, 10, 22, 22, 22),
                entityId: '123451234512345123451100',
                userId: '22bf0E5D6D4F5bEf1E3Fef48',
                action: 'DELETE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e7ea2e4451a83e87e83c7e',
                timestamp: new Date(2021, 10, 13, 16, 30),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4F5bMf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: 'v',
                timestamp: new Date(2020, 10, 2, 5, 50),
                entityId: '123451234512345123451100',
                userId: '22bf1E5L6D4M5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234512345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e83c7c',
                    entityId: '123451234512345123451108',
                },
            },
            {
                _id: '61e7ea2e4451aa3e87e88c7e',
                timestamp: new Date(2021, 9, 28, 17, 4),
                entityId: '123451234512345123451100',
                userId: '22bp1V5D6DSF5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123450234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a23e87e43c7c',
                    entityId: '123451134512345123451708',
                },
            },
            {
                _id: '61e7ea6d4951a23e87e83c7e',
                timestamp: new Date(2021, 9, 21, 12, 0),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6Z8F5bEf1E3Fef48',
                action: 'ACTIVATE_ENTITY',
            },
            {
                _id: '61e7ea6e4151a83e87e83c7e',
                timestamp: new Date(2021, 9, 19, 16, 55),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bUf1E3Fef48',
                action: 'DISABLE_ENTITY',
            },
            {
                _id: '61e7ea2e4250a83e87e83c7e',
                timestamp: new Date(2021, 9, 11, 11, 11),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D895bEf1E3Fef48',
                action: 'DELETE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e9ea2e4451a83e87e83c7e',
                timestamp: new Date(2021, 9, 6, 17, 5),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F3bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123471234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a73e87e43c7c',
                    entityId: '123451234572345123451708',
                },
            },
            {
                _id: '64e7ea6e4451a83e87e83c7e',
                timestamp: new Date(2021, 9, 2, 8, 17),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D8F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234519345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a73e87e43c7c',
                    entityId: '123451234512345103451108',
                },
            },
            {
                _id: '60e3ea6e4151a88e87e83c7e',
                timestamp: new Date(2021, 8, 19, 7, 27),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'UPDATE_ENTITY',
                metadata: {
                    updatedFields: [
                        {
                            fieldName: 'firstName',
                            oldValue: 'נועהה',
                            newValue: 'נועה',
                        },
                        {
                            fieldName: 'age',
                            oldValue: 22,
                            newValue: 23,
                        },
                    ],
                },
            },
        ],
    ]);

    mock.onGet(/\/api\/activity-log\/[0-9a-fA-F]{24}/, { params: { skip: 10, limit: 10 } }).reply(() => [
        200,
        [
            {
                _id: '61e7ea2e4251a83e87e83c7e',
                timestamp: new Date(2021, 8, 18, 11, 52),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4F5bEf1E3Fef48',
                action: 'DELETE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e7ea2e4451a83e87e83c7e',
                timestamp: new Date(2021, 8, 3, 18, 27),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: 'v',
                timestamp: new Date(2020, 7, 19, 8, 44),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4M5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234512345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e83c7c',
                    entityId: '123451234512345123451108',
                },
            },
            {
                _id: '61e7ea2e4451aa3e87e88c7e',
                timestamp: new Date(2021, 7, 2, 10, 8),
                entityId: '123451234512345123451100',
                userId: '22bp1V5D6D4F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123450234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a23e87e43c7c',
                    entityId: '123451134512345123451708',
                },
            },
            {
                _id: '61e7ea6d4951a23e87e83c7e',
                timestamp: new Date(2021, 7, 1, 7, 10),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'ACTIVATE_ENTITY',
            },
            {
                _id: '61e7ea6e4151a83e87e83c7e',
                timestamp: new Date(2021, 4, 3, 6, 57),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'DISABLE_ENTITY',
            },
            {
                _id: '61e7ea2e4250a83e87e83c7e',
                timestamp: new Date(2021, 3, 14, 19, 2),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D8F5bEf1E3Fef48',
                action: 'DELETE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e0ea2e4451a83e87e83c7e',
                timestamp: new Date(2021, 1, 26, 15, 45),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123471234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a73e87e43c7c',
                    entityId: '123451234572345123451708',
                },
            },
            {
                _id: '61e7ea6e4451a83e87e83c7e',
                timestamp: new Date(2021, 1, 8, 9, 42),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D8F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234519345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a73e87e43c7c',
                    entityId: '123451234512345103451108',
                },
            },
            {
                _id: '61e3ea6e4151a00e87e83c7e',
                timestamp: new Date(2021, 1, 5, 11, 29),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'UPDATE_ENTITY',
                metadata: {
                    updatedFields: [
                        {
                            fieldName: 'age',
                            oldValue: 21,
                            newValue: 22,
                        },
                    ],
                },
            },
            {
                _id: '61e3ea6e4151a88e87e83c7e',
                timestamp: new Date(2020, 12, 14, 7, 47),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'UPDATE_ENTITY',
                metadata: {
                    updatedFields: [
                        {
                            fieldName: 'firstName',
                            oldValue: 'נעה',
                            newValue: 'נועהה',
                        },
                    ],
                },
            },
        ],
    ]);

    mock.onGet(/\/api\/activity-log\/[0-9a-fA-F]{24}/, { params: { skip: 20, limit: 10 } }).reply(() => [
        200,
        [
            {
                _id: '61e7ea2e4451aa3e87e83c7e',
                timestamp: new Date(2020, 12, 3, 9, 58),
                entityId: '123451234512345123451100',
                userId: '22bp1V5D6D4F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123450234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a23e87e43c7c',
                    entityId: '123451134512345123451708',
                },
            },
            {
                _id: '61e7ea6d4951a83e87e83c7e',
                timestamp: new Date(2020, 10, 28, 12, 10),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D9D8F5bEf1E3Fef48',
                action: 'ACTIVATE_ENTITY',
            },
            {
                _id: '61e7ea6e4150a83e87e83c7e',
                timestamp: new Date(2020, 5, 19, 17, 41),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D8D4F5bEf1E3Fef48',
                action: 'DISABLE_ENTITY',
            },
            {
                _id: '61e7ea2e4250a83e87e83c7e',
                timestamp: new Date(2020, 4, 8, 14, 12),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4F5bEf1E3Fef48',
                action: 'DELETE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e0ea2e4451a83e87e83c7e',
                timestamp: new Date(2020, 4, 8, 12, 27),
                entityId: '123451234512345123451100',
                userId: '22bf1V5D6D4F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234515345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e43c7c',
                    entityId: '123451234512345123451708',
                },
            },
            {
                _id: '61e7ea6e4451a83e87e83c7e',
                timestamp: new Date(2020, 4, 8, 8, 2),
                entityId: '123451234512345123451100',
                userId: '22bf1E5D6D4F5bEf1E3Fef48',
                action: 'CREATE_RELATIONSHIP',
                metadata: {
                    relationshipId: '123451234512345123421108',
                    relationshipTemplateId: '61e3ea6e4d51a83e87e83c7c',
                    entityId: '123451234512345123451108',
                },
            },
            {
                _id: '61e7ea6e4951a83e77e83c7e',
                timestamp: new Date(2020, 3, 5, 10, 9),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D8F5bEf1E3Fef48',
                action: 'ACTIVATE_ENTITY',
            },
            {
                _id: '61e7ea6e0051a83e87e83c7e',
                timestamp: new Date(2020, 3, 5, 9, 47),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D4F5bEf1E3Fef48',
                action: 'DISABLE_ENTITY',
            },
            {
                _id: '61e3ea6e4151a88e87e83c7e',
                timestamp: new Date(2020, 2, 18, 12, 57),
                entityId: '123451234512345123451100',
                userId: '29bf4E5D6D8F5bEf1E3Fef48',
                action: 'UPDATE_ENTITY',
                metadata: {
                    updatedFields: [
                        {
                            fieldName: 'firstName',
                            oldValue: 'נועה',
                            newValue: 'נעה',
                        },
                        {
                            fieldName: 'age',
                            oldValue: 20,
                            newValue: 21,
                        },
                    ],
                },
            },
            {
                _id: '61e3ea6e4151a83e87e83c7e',
                timestamp: new Date(2020, 2, 17, 17, 24),
                entityId: '123451234512345123451100',
                userId: '29bf1E5D6D8F5bEf1E3Fef48',
                action: 'CREATE_ENTITY',
            },
        ],
    ]);

    mock.onGet(/\/api\/activity-log\/[0-9a-fA-F]{24}/, { params: { skip: 30, limit: 10 } }).reply(() => [200, []]);
};

export { mockActivityLog };
