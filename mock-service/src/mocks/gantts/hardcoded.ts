import { IGantt } from '@microservices/shared';

const getHardcodedRealGantts = (fliesOnId: string, flightId: string, tripId: string): IGantt[] => {
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
                    connectedEntityTemplates: [],
                },
                {
                    entityTemplate: {
                        id: flightId,
                        startDateField: 'departureDate',
                        endDateField: 'landingDate',
                        fieldsToShow: ['from', 'to'],
                    },
                    connectedEntityTemplates: [
                        {
                            relationshipTemplateId: fliesOnId,
                            fieldsToShow: ['firstName', 'lastName'],
                        },
                    ],
                },
            ],
        },
    ];
};

export default getHardcodedRealGantts;
