import React, { CSSProperties } from 'react';
import { Typography } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';

const { ganttSettings } = environment;

interface IFieldsDisplayProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    fieldsToShow: string[];
    color: CSSProperties['color'];
    fontSize?: CSSProperties['fontSize'];
}

export const FieldsDisplay: React.FC<IFieldsDisplayProps> = ({ entityTemplate, fieldsToShow, color, fontSize = 12 }) => {
    return (
        <Typography color={color} fontSize={fontSize}>
            {fieldsToShow.map((field, index) => (
                (index ? ganttSettings.separators.field : '') + entityTemplate.properties.properties[field].title
            ))}
        </Typography>
    );
};
