import { IMockRelationshipTemplate } from '../../templates/relationshipTemplates';

const relationshipTemplates: IMockRelationshipTemplate[] = [
    {
        name: 'parents',
        displayName: 'בעלים',
        sourceEntityId: { name: 'car' },
        destinationEntityId: { name: 'driver' },
        isProperty: true,
    },
];

export default relationshipTemplates;
