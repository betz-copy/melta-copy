import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityInstance } from '../../../interfaces/instances';

const TemplateTable: React.FC<{ template: IMongoEntityTemplatePopulated & { entities: IEntityInstance[] } }> = ({ template }) => {
    return (
        <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                <Typography variant="h5">{template.displayName}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Typography>{template.entities.map((entity) => JSON.stringify(entity.properties))}</Typography>
            </AccordionDetails>
        </Accordion>
    );
};

export { TemplateTable };
