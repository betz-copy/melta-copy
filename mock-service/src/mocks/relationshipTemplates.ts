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
        name: 'flightOf', 
        displayName: 'טיסה של',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'tourist' },
    },
    {
        name: 'departureFrom',
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
    {
        name: 'flightInTrip',
        displayName: 'טיסה משוייכת לטיול',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'trip' },
    },
    {
        name: 'tripConnectedToAirport',
        displayName: 'טיסה משוייכת לשדה תעופה',
        sourceEntityId: { name: 'airport' },
        destinationEntityId: { name: 'trip' },
    },
];
