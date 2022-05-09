import MockAdapter from 'axios-mock-adapter';

const mockRelationships = (mock: MockAdapter) => {
    mock.onPost('/api/instances/relationships').reply(({ data }) => {
        const relationshipToCreate = JSON.parse(data);
        return [
            200,
            {
                ...relationshipToCreate,
                properties: { ...relationshipToCreate.properties, _id: '012345678901234567890123' },
            },
        ];
    });

    mock.onDelete(/\/api\/instances\/relationships\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {}, // backend should return deleted relationship, but not used anyway in UI
    ]);
};

export { mockRelationships };
