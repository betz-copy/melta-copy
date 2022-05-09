import MockAdapter from 'axios-mock-adapter';

const relationshipTemplates = [
    {
        _id: '61e3ea6e4d51a83e87e83c7e',
        name: 'going on',
        displayName: 'משתתף ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
    },
    {
        _id: '61e3ea6e4d51a83e87e83c7c',
        name: 'sold trip to',
        displayName: 'מכר טיול ל',
        sourceEntityId: '61e3ea6e4d51a83e87e83c80',
        destinationEntityId: '61e3ea6e4d51a83e87e83c7f',
    },
    {
        _id: '61e3ea6e4d51a83e87e43c7c',
        name: 'flies on',
        displayName: 'טס על',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c81',
    },
    {
        _id: '61e3ea6e4d51a73e87e43c7c',
        name: 'departue from',
        displayName: 'ממריא מ',
        sourceEntityId: '61e3ea6e4d51a83e87e83c81',
        destinationEntityId: '61e3ea6e4d51a83e87e83c82',
    },
    {
        _id: '61e3ea6e4d51a23e87e43c7c',
        name: 'stays in',
        displayName: 'ישן ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c83',
    },
    {
        _id: '61e3ea6e3d51a83e87e43c7c',
        name: 'stays in',
        displayName: 'ישן ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c84',
    },
];

const mockRelationshipTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/relationships').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'going on',
            displayName: 'משתתף ב',
            sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
            destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/relationships\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'going on',
            displayName: 'משתתף ב',
            sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
            destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/relationships\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockRelationshipTemplates, relationshipTemplates };
