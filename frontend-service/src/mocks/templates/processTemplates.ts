import MockAdapter from 'axios-mock-adapter';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { generateProcessTemplatePopulated } from './generateProcessTemplate';

const removeDuplicates = (arr: IMongoProcessTemplatePopulated[]) => {
    const uniqueDisplayNames = new Set();
    return arr.filter((obj) => {
        if (uniqueDisplayNames.has(obj.displayName)) {
            return false;
        }
        uniqueDisplayNames.add(obj.displayName);
        return true;
    });
};
const generatedTemplates: ReadonlyArray<IMongoProcessTemplatePopulated> = removeDuplicates(
    Array.from({ length: 10 }, () => generateProcessTemplatePopulated()),
);
const processTemplates = generatedTemplates;

const mockProcessTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/processes').reply(() => [200, generateProcessTemplatePopulated()]);

    // Update
    mock.onPut(/\/api\/templates\/processes\/[0-9a-fA-F]{24}/).reply(() => [200, generateProcessTemplatePopulated()]);

    // Delete
    mock.onDelete(/\/api\/templates\/processes\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockProcessTemplates, processTemplates };
