export const relationshipTemplates = [
    {
        name: 'goingOn',
        displayName: 'משתתף ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'trip' },
    },
    {
        name: 'soldTripTo',
        displayName: 'מכר טיול ל',
        sourceEntityId: { name: 'travelAgent' },
        destinationEntityId: { name: 'tourist' },
    },
    {
        name: 'fliesOn',
        displayName: 'טס על',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'flight' },
    },
    {
        name: 'departueFrom',
        displayName: 'ממריא מ',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'airport' },
    },
    {
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'hotel' },
    },
    {
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'airbnb' },
    },
];
