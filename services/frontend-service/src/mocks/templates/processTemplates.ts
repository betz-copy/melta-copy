import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';
import { IMongoProcessTemplateReviewerPopulated } from '@microservices/shared-interfaces';
import { generateProcessTemplatePopulated } from './generateProcessTemplate';

const removeDuplicates = (arr: IMongoProcessTemplateReviewerPopulated[]) => {
    const uniqueDisplayNames = new Set();
    return arr.filter((obj) => {
        if (uniqueDisplayNames.has(obj.displayName)) {
            return false;
        }
        uniqueDisplayNames.add(obj.displayName);
        return true;
    });
};
const generatedTemplates: ReadonlyArray<IMongoProcessTemplateReviewerPopulated> = removeDuplicates(
    Array.from({ length: 10 }, () => generateProcessTemplatePopulated()),
);
const processTemplates = generatedTemplates;

const mockProcessTemplates = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/processes').reply(() => [StatusCodes.OK, generateProcessTemplatePopulated()]);

    // Update
    mock.onPut(/\/api\/templates\/processes\/[0-9a-fA-F]{24}/).reply(() => [StatusCodes.OK, generateProcessTemplatePopulated()]);

    // Delete
    mock.onDelete(/\/api\/templates\/processes\/[0-9a-fA-F]{24}/).reply(() => [StatusCodes.OK, {}]);
};

export { mockProcessTemplates, processTemplates };
