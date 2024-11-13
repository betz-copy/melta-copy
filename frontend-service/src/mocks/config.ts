import MockAdapter from 'axios-mock-adapter';
import { StatusCodes } from 'http-status-codes';

const mockConfig = (mock: MockAdapter) => {
    mock.onGet('/api/config').reply(() => [
        StatusCodes.OK,
        {
            contactByMailLink: 'mailAdr@gmail.com',
            contactByChatLink: 'http://chat.com',
        },
    ]);
};

export { mockConfig };
