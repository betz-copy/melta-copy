/* eslint-disable import/no-extraneous-dependencies */
import { Chance } from 'chance';
import faker from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { categories } from './templates/categories';
import { IUser } from '../interfaces/users';

const chance = new Chance();
faker.locale = 'he';

export const generateMongoId = () => chance.string({ pool: 'abcdef0123456789', length: 24 });

const generateUser = (): IUser => {
    const hierarchy = chance.pickone([
        '',
        Array.from({ length: 7 })
            .map(() => faker.commerce.department())
            .join('/'),
    ]);
    const name = { firstName: faker.name.firstName(), lastName: faker.name.lastName() };
    const fullName = `${name.firstName} ${name.lastName}`;
    return {
        _id: generateMongoId(),
        fullName,
        jobTitle: faker.name.jobTitle(),
        hierarchy,
        mail: faker.internet.email(name.firstName, name.lastName),
        preferences: {
            darkMode: chance.bool(),
        },
        externalMetadata: {
            kartoffelId: generateMongoId(),
            digitalIdentitySource: chance.pickone(['source1', 'source2', 'source3']),
        },
        permissions: {},
        displayName: `${fullName} - ${hierarchy}/${faker.name.jobTitle()}`,
    };
};

const generatePermissionsOfUser = () => ({
    user: generateUser(),
    permissionsManagementId: chance.pickone([generateMongoId(), null]),
    templatesManagementId: generateMongoId(),
    processesManagementId: chance.pickone([generateMongoId(), null]),
    rulesManagementId: chance.pickone([generateMongoId(), null]),
    instancesPermissions: chance.pickset(
        categories.map(({ _id: category }) => ({ _id: generateMongoId(), category, scope: ['Read', 'Write'] })),
        chance.integer({ min: 0, max: categories.length }),
    ),
});

const mockPermissions = (mock: MockAdapter) => {
    mock.onGet(/\/api\/users\/search.*/).reply(() => [StatusCodes.OK, Array.from({ length: 10 }).map(generateUser)]);
    mock.onGet(/\/api\/users\/all.*/).reply(() => [StatusCodes.OK, Array.from({ length: 200 }).map(generateUser)]);

    mock.onGet(/\/api\/users\.*/).reply(() => [StatusCodes.OK, generateUser]);

    mock.onGet('/api/permissions/my').reply(() => [StatusCodes.OK, generatePermissionsOfUser()]);

    mock.onPost('/api/permissions/bulk').reply(({ data: permissionsToCreate }) => {
        const createdPermissions = JSON.parse(permissionsToCreate).map((permissionToCreate) => ({ ...permissionToCreate, _id: generateMongoId() }));
        return [StatusCodes.OK, createdPermissions];
    });

    mock.onDelete(/\/api\/permissions.*/).reply(
        () => [StatusCodes.OK, {}], // backend should return deleted permission, but not used anyway in UI
    );

    mock.onGet('/api/permissions').reply(() => [StatusCodes.OK, Array.from({ length: 200 }).map(() => generatePermissionsOfUser())]);
};

export { mockPermissions, generateUser };
