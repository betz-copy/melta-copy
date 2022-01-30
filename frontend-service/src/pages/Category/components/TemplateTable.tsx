/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { IEntityInstance, IMongoEntityTemplatePopulated } from '../../../interfaces';

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
