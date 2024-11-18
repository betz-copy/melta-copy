import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';

const relationshipTemplates: IMongoRelationshipTemplate[] = [
    {
        _id: '61e3ea6e4d51a83e87e83c7e',
        name: 'goingOn',
        displayName: 'משתתף ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
        createdAt: new Date(1111, 10, 1).toISOString(),
        updatedAt: new Date(2222, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e4d51a83e87e83c7c',
        name: 'soldTripTo',
        displayName: 'מכר טיול ל',
        sourceEntityId: '61e3ea6e4d51a83e87e83c80',
        destinationEntityId: '61e3ea6e4d51a83e87e83c7f',
        createdAt: new Date(3333, 10, 1).toISOString(),
        updatedAt: new Date(4444, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e4d51a83e87e43c7c',
        name: 'fliesOn',
        displayName: 'טס על',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c81',
        createdAt: new Date(5555, 10, 1).toISOString(),
        updatedAt: new Date(6666, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e4d51a73e87e43c7c',
        name: 'departueFrom',
        displayName: 'ממריא מ',
        sourceEntityId: '61e3ea6e4d51a83e87e83c81',
        destinationEntityId: '61e3ea6e4d51a83e87e83c82',
        createdAt: new Date(7777, 10, 1).toISOString(),
        updatedAt: new Date(8888, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e4d51a23e87e43c7c',
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c83',
        createdAt: new Date(9999, 10, 1).toISOString(),
        updatedAt: new Date(1122, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e3d51a83e87e43c7c',
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
        destinationEntityId: '61e3ea6e4d51a83e87e83c84',
        createdAt: new Date(1212, 10, 1).toISOString(),
        updatedAt: new Date(2121, 10, 1).toISOString(),
        isProperty: true,
    },
    {
        _id: '61e3ea6e3d51a83e87e42c7c',
        name: 'flightInTrip',
        displayName: 'טיסה משוייכת לטיול',
        sourceEntityId: '61e3ea6e4d51a83e87e83c81',
        destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
        createdAt: new Date(2323, 10, 1).toISOString(),
        updatedAt: new Date(3232, 10, 1).toISOString(),
        isProperty: true,
    },
];

const mockRelationshipTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/relationships').reply(() => [
        StatusCodes.OK,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'goingOn',
            displayName: 'משתתף ב',
            sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
            destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
            createdAt: new Date(1111, 10, 1).toISOString(),
            updatedAt: new Date(2222, 10, 1).toISOString(),
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/relationships\/[0-9a-fA-F]{24}/).reply(() => [
        StatusCodes.OK,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
            name: 'goingOn',
            displayName: 'משתתף ב',
            sourceEntityId: '61e3ea6e4d51a83e87e83c7f',
            destinationEntityId: '61e3ea6e4d51a83e87e83c7e',
            createdAt: new Date(1111, 10, 1).toISOString(),
            updatedAt: new Date(2222, 10, 1).toISOString(),
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/relationships\/[0-9a-fA-F]{24}/).reply(() => [StatusCodes.OK, {}]);
};

export { mockRelationshipTemplates, relationshipTemplates };
