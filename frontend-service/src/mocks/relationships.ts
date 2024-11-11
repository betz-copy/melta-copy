import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';

const mockRelationships = (mock: MockAdapter) => {
    mock.onPost('/api/instances/relationships').reply(({ data }) => {
        const { relationshipInstance: relationshipToCreate } = JSON.parse(data);

        return [
            StatusCodes.OK,
            {
                ...relationshipToCreate,
                properties: { ...relationshipToCreate.properties, _id: '012345678901234567890123' },
            },
        ];
    });

    mock.onDelete(/\/api\/instances\/relationships\/[0-9a-fA-F]{24}/).reply(() => {
        return [
            StatusCodes.OK,
            {}, // backend should return deleted relationship, but not used anyway in UI
        ];
    });
};

export { mockRelationships };
