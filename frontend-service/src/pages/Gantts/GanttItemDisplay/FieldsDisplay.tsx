import { Typography } from '@mui/material';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import React, { CSSProperties } from 'react';
import { environment } from '../../../globals';

const { ganttSettings } = environment;

interface IFieldsDisplayProps {
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    fieldsToShow: string[];
    color: CSSProperties['color'];
    fontSize?: CSSProperties['fontSize'];
}

export const FieldsDisplay: React.FC<IFieldsDisplayProps> = ({ entityTemplate, fieldsToShow, color, fontSize = 12 }) => {
    return (
        <Typography color={color} fontSize={fontSize}>
            {fieldsToShow.map((field, index) => (index ? ganttSettings.separators.field : '') + entityTemplate.properties.properties[field].title)}
        </Typography>
    );
};
