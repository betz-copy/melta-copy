import MockAdapter from 'axios-mock-adapter';

const mockCategories = (mock: MockAdapter) => {
    // Get All
    mock.onGet('/api/categories').reply(() => [
        200,
        [
            {
                _id: '61e3d8384d51a83e87e83c74',
                name: 'pepole',
                displayName: 'אנשים',
            },
            {
                _id: '61e3d8384d51a83e87e83c75',
                name: 'flights',
                displayName: 'טיסות',
            },
            {
                _id: '61e3d8384d51a83e87e83c76',
                name: 'hotels',
                displayName: 'מלונות',
            },
            {
                _id: '61e3d8384d51a83e87e83c77',
                name: 'money',
                displayName: 'כסף',
            },
            {
                _id: '61e3d8384d51a83e87e83c78',
                name: 'things',
                displayName: 'דברים',
            },
            {
                _id: '61e3d8384d51a83e87e83c79',
                name: 'communcation',
                displayName: 'תקשורת',
            },
            {
                _id: '61e3dee74d51a83e87e83c7b',
                name: 'trips',
                displayName: 'טיולים',
            },
        ],
    ]);

    // Create
    mock.onPost('/api/categories').reply(() => [
        200,
        {
            _id: '61e328384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
        },
    ]);

    // Update
    mock.onPut(/\/api\/categories\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנששדגשדגים',
        },
    ]);
};

export { mockCategories };
