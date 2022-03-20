import MockAdapter from 'axios-mock-adapter';

const mockRelationshipTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/relationships/templates').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'trip',
            displayName: 'טיול',
            sourceEntityId: '61e3ea6e4d51653e87e83c7e',
            destinationEntityId: '61e3ea6e4d5143e87e83c7e',
        },
    ]);
};

export { mockRelationshipTemplates };
