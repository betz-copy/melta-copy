/* eslint-disable import/no-extraneous-dependencies */
import { Chance } from 'chance';
import faker from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { categories } from './templates/categories';

const chance = new Chance();
faker.locale = 'he';

const generateMongoId = () => chance.string({ pool: 'abcdefABCDEF0123456789', length: 24 });

const generateUserDigitalIdentities = () => {
    const sources = chance.pickset(['source1', 'source2', 'source3'], chance.integer({ min: 1, max: 3 }));
    return sources.map((source) => ({ uniqueId: chance.email({ domain: source }) }));
};
const generateUser = () => {
    const hierarchy = chance.pickone([
        undefined,
        Array.from({ length: 7 })
            .map(() => faker.commerce.department())
            .join('/'),
    ]);
    const name = { firstName: faker.name.firstName(), lastName: faker.name.lastName() };
    const fullName = `${name.firstName} ${name.lastName}`;
    return {
        id: generateMongoId(), // kartoffelId
        displayName: `${fullName}${hierarchy ? ` - ${hierarchy}` : ''}`,
        digitalIdentities: generateUserDigitalIdentities(),
        firstName: name.firstName,
        lastName: name.lastName,
        fullName,
    };
};

const generatePermissionsOfUser = () => {
    return {
        user: generateUser(),
        permissionsManagementId: chance.pickone([generateMongoId(), null]),
        templatesManagementId: chance.pickone([generateMongoId(), null]),
        instancesPermissions: chance.pickset(
            categories.map(({ _id: category }) => ({ _id: generateMongoId(), category })),
            chance.integer({ min: 0, max: categories.length }),
        ),
    };
};

const mockPermissions = (mock: MockAdapter) => {
    mock.onGet(/\/api\/users\/search.*/).reply(() => {
        return [200, Array.from({ length: 10 }).map(generateUser)];
    });

    mock.onGet(/\/api\/users\.*/).reply(() => {
        return [200, generateUser];
    });

    mock.onGet('/api/permissions/my').reply(() => {
        return [200, generatePermissionsOfUser()];
    });

    mock.onPost('/api/permissions/bulk').reply(({ data: permissionsToCreate }) => {
        const createdPermissions = JSON.parse(permissionsToCreate).map((permissionToCreate) => ({ ...permissionToCreate, _id: generateMongoId() }));
        return [200, createdPermissions];
    });

    mock.onDelete(/\/api\/permissions.*/).reply(() => {
        return [200, {}]; // backend should return deleted permission, but not used anyway in UI
    });

    mock.onGet('/api/permissions').reply(() => {
        return [200, Array.from({ length: 200 }).map(() => generatePermissionsOfUser())];
    });
};

export { mockPermissions };
