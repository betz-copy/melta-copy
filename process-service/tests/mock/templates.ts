export const reviewerIds = ['5e5688324203fc40043591aa', '61d37cb5e4de0300121e31ef', '61db10dae4de0300121f72a7', '61a0c2e3e4de0300121dd622'];
const processTemplateExample1 = {
    name: 'example',
    displayName: 'דוגמה',
    details: {
        propertiesOrder: ['name', 'age', 'email'],
        properties: {
            type: 'object',
            properties: {
                name: {
                    title: 'שם מלא',
                    type: 'string',
                },
                age: {
                    title: 'גיל',
                    type: 'number',
                },
                email: {
                    title: 'כתובת דואר אלקטרוני',
                    type: 'string',
                    format: 'email',
                },
            },
            required: ['name', 'email'],
        },
    },
    steps: [
        {
            name: 'exampleStep1',
            displayName: 'שלב דוגמה 1',
            propertiesOrder: ['name', 'age', 'email'],
            reviewers: [reviewerIds[0]],
            properties: {
                type: 'object',
                properties: {
                    name: {
                        title: 'שם מלא',
                        type: 'string',
                    },
                    age: {
                        title: 'גיל',
                        type: 'number',
                    },
                    email: {
                        title: 'כתובת דואר אלקטרוני',
                        type: 'string',
                        format: 'email',
                    },
                },
                required: ['name', 'email'],
            },
        },
        {
            name: 'exampleStep2',
            displayName: 'שלב דוגמה 2',
            propertiesOrder: ['phone', 'address'],
            reviewers: [reviewerIds[1]],
            properties: {
                type: 'object',
                properties: {
                    phone: {
                        title: 'מספר טלפון',
                        type: 'string',
                    },
                    address: {
                        title: 'כתובת מגורים',
                        type: 'string',
                    },
                },
                required: ['address'],
            },
        },
    ],
};

export const errUpdateTemplateExample1 = {
    name: 'ErrExample', // can not change process template Name
    displayName: 'דוגמה',
    details: {
        propertiesOrder: ['name', 'age', 'email'],
        properties: {
            type: 'object',
            properties: {
                // can not remove properties
                // name: {
                //     title: 'שם מלא',
                //     type: 'string',
                // },
                age: {
                    title: 'גיל',
                    type: 'string', // can not change type
                },
                email: {
                    title: 'כתובת דואר אלקטרוני',
                    type: 'string',
                    format: 'enum', // can not change format
                },
            },
            required: ['name', 'email'],
        },
    },
    steps: [
        // can not delete steps
        // {
        //     name: 'exampleStep1',
        //     displayName: 'שלב דוגמה 1',
        //     propertiesOrder: ['name', 'age', 'email'],
        //     reviewers: ['5e5688324203fc40043591aa', '61d37cb5e4de0300121e31ef'],
        //     properties: {
        //         type: 'object',
        //         properties: {
        //             name: {
        //                 title: 'שם מלא',
        //                 type: 'string',
        //             },
        //             age: {
        //                 title: 'גיל',
        //                 type: 'number',
        //             },
        //             email: {
        //                 title: 'כתובת דואר אלקטרוני',
        //                 type: 'string',
        //                 format: 'email',
        //             },
        //         },
        //         required: ['name', 'email'],
        //     },
        // },
        {
            name: 'ERRexampleStep2', // can not change step template Name
            displayName: 'שלב דוגמה 2',
            propertiesOrder: ['phone', 'address'],
            reviewers: ['61db10dae4de0300121f72a7', '61a0c2e3e4de0300121dd622'],
            properties: {
                type: 'object',
                properties: {
                    phone: {
                        title: 'מספר טלפון',
                        type: 'string',
                    },
                    address: {
                        title: 'כתובת מגורים',
                        type: 'string',
                    },
                },
                required: ['address'],
            },
        },
    ],
};
export default processTemplateExample1;
