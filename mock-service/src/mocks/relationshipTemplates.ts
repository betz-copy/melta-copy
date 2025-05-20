import { IMockRelationshipTemplate } from '../templates/relationshipTemplates';

const relationshipTemplates: IMockRelationshipTemplate[] = [
    {
        name: 'goingOn',
        displayName: 'משתתף ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'trip' },
        isProperty: false,
    },
    {
        name: 'soldTripTo',
        displayName: 'מכר טיול ל',
        sourceEntityId: { name: 'travelAgent' },
        destinationEntityId: { name: 'tourist' },
        isProperty: false,
    },
    {
        name: 'fliesOn',
        displayName: 'טס על',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'flight' },
        isProperty: false,
    },
    {
        name: 'flightOf',
        displayName: 'טיסה של',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'tourist' },
        isProperty: false,
    },
    {
        name: 'departureFrom',
        displayName: 'ממריא מ',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'airport' },
        isProperty: false,
    },
    {
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'hotel' },
        isProperty: false,
    },
    {
        name: 'staysIn',
        displayName: 'ישן ב',
        sourceEntityId: { name: 'tourist' },
        destinationEntityId: { name: 'airbnb' },
        isProperty: false,
    },
    {
        name: 'flightInTrip',
        displayName: 'טיסה משוייכת לטיול',
        sourceEntityId: { name: 'flight' },
        destinationEntityId: { name: 'trip' },
        isProperty: false,
    },
    {
        name: 'tripConnectedToAirport',
        displayName: 'טיסה משוייכת לשדה תעופה',
        sourceEntityId: { name: 'airport' },
        destinationEntityId: { name: 'trip' },
        isProperty: false,
    },
];

export default relationshipTemplates;
