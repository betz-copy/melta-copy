export const relationshipTemplates = [
    {
        name: 'going on',
        displayName: 'משתתף ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'trip' },
    },
    {
        name: 'sold trip to',
        displayName: 'מכר טיול ל',
        sourceEntityId: { name: 'travelAgent' },
        destinationEntityId: { name: 'tourist' },
    },
    {
        name: 'flies on',
        displayName: 'טס על',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'flight' },
    },
    {
        name: 'departue from',
        displayName: 'ממריא מ',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'airport' },
    },
    {
        name: 'stays in',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'hotel' },
    },
    {
        name: 'stays in',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'airbnb' },
    },
];
