import MockAdapter from 'axios-mock-adapter';

const mockConfig = (mock: MockAdapter) => {
    mock.onGet('/api/config').reply(() => [
        200,
        {
            contactByMailLink: 'mailAdr@gmail.com',
            contactByChatLink: 'http://chat.com',
        },
    ]);
};

export { mockConfig };
