import { IGantt } from '../gantts';

export const getHardcodedRealGantts = (fliesOnId: string, flightId: string, tripId: string): IGantt[] => {
    return [
        {
            name: 'flightsAndTrips',
            items: [
                {
                    entityTemplate: {
                        id: tripId,
                        startDateField: 'startDate',
                        endDateField: 'endDate',
                        fieldsToShow: ['name'],
                    },
                },
                {
                    entityTemplate: {
                        id: flightId,
                        startDateField: 'departureDate',
                        endDateField: 'landingDate',
                        fieldsToShow: ['from', 'to'],
                    },
                    connectedEntityTemplate: {
                        relationshipTemplateId: fliesOnId,
                        fieldsToShow: ['firstName', 'lastName'],
                    },
                },
            ],
        },
    ];
};

export const getRandomGantts = (): IGantt[] => [];
