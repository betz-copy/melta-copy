export const processInstanceExample1 = {
    name: 'name1',
    details: {
        name: 'test',
        age: 5,
        email: 'nadav@gmail.com',
    },
    startDate: new Date('1995-12-17T03:24:00'),
    endDate: new Date('1997-12-17T03:24:00'),
};

export const stepsPropertiesExample1 = [
    {
        properties: {
            name: 'John Doe',
            age: 30,
            email: 'john.doe@example.com',
        },
    },
    {
        properties: {
            phone: '987-654-3210',
            address: '456 Elm St',
        },
    },
];

export const errStepsPropertiesExample1 = [
    {
        properties: {
            age: 30,
            email: 'john.doe@example.com',
        },
    },
    {
        properties: {
            phone: '987-654-3210',
            address: 40,
        },
    },
];
export default processInstanceExample1;
