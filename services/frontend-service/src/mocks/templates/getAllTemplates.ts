import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { categories } from './categories';
import { entityTemplates } from './entityTemplates';
import { relationshipTemplates } from './relationshipTemplates';
import { processTemplates } from './processTemplates';
import { rules } from './rules';

const mockGetAllTemplates = (mock: MockAdapter) => {
    mock.onGet('/api/templates/all').reply(() => [
        StatusCodes.OK,
        {
            categories,
            entityTemplates,
            relationshipTemplates,
            processTemplates,
            rules,
        },
    ]);
};

export { mockGetAllTemplates };
