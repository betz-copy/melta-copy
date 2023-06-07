import MockAdapter from 'axios-mock-adapter';
import { categories } from './categories';
import { entityTemplates } from './entityTemplates';
import { relationshipTemplates } from './relationshipTemplates';
import { processTemplates } from './processTemplates';
import { rules } from './rules';

const mockGetAllTemplates = (mock: MockAdapter) => {
    mock.onGet('/api/templates/all').reply(() => [
        200,
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
