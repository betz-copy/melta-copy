import MockAdapter from 'axios-mock-adapter';

const categories = [
    {
        _id: '61e3d8384d51a83e87e83c74',
        name: 'pepole',
        displayName: 'אנשים',
        color: '#B80000',
    },
    {
        _id: '61e3d8384d51a83e87e83c75',
        name: 'flights',
        displayName: 'טיסות',
        color: '#E65100',
    },
    {
        _id: '61e3d8384d51a83e87e83c76',
        name: 'hotels',
        displayName: 'מלונות',
        color: '#FCDC00',
    },
    {
        _id: '61e3d8384d51a83e87e83c77',
        name: 'money',
        displayName: 'כסף',
        color: '#F78DA7',
    },
    {
        _id: '61e3d8384d51a83e87e83c78',
        name: 'things',
        displayName: 'דברים',
        color: '#7B1FA2',
    },
    {
        _id: '61e3d8384d51a83e87e83c79',
        name: 'communcation',
        displayName: 'תקשורת',
        color: '#0D47A1',
    },
    {
        _id: '61e3dee74d51a83e87e83c7b',
        name: 'trips',
        displayName: 'טיולים',
        color: '#B3E5FC',
    },
];

const mockCategories = (mock: MockAdapter) => {
    // Create
    mock.onPost('/api/templates/categories').reply(() => [
        200,
        {
            _id: '61e328384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנשים',
        },
    ]);

    // Update
    mock.onPut(/\/api\/templates\/categories\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            _id: '61e3d8384d51a83e87e83c74',
            name: 'pepole',
            displayName: 'אנששדגשדגים',
        },
    ]);

    // Delete
    mock.onDelete(/\/api\/templates\/categories\/[0-9a-fA-F]{24}/).reply(() => [200, {}]);
};

export { mockCategories, categories };
