import { Grid, Tooltip, Typography } from '@mui/material';
import React, { CSSProperties } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import { formatToString } from '../../../common/EntityProperties';

const { ganttSettings } = environment;

interface IFieldsDisplayProps {
    fields: string[];
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    underlineColor?: CSSProperties['color'];
    expanded?: boolean;
}

export const FieldsDisplay: React.FC<IFieldsDisplayProps> = ({ fields, entity, entityTemplate, underlineColor, expanded }) => {
    return (
        <>
            {fields.map((field, index) => {
                const { title: fieldName, type, format } = entityTemplate.properties.properties[field];

                return (
                    <>
                        {!expanded && (
                            <Grid item key={`${entity.properties._id}-${field}-spacer`}>
                                <Typography fontSize={14} fontWeight="bold" color="white">
                                    {Boolean(index) && ganttSettings.fieldSeparator}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item key={`${entity.properties._id}-${field}`}>
                            <Tooltip title={`${fieldName} (${entityTemplate.displayName})`} placement="top" disableHoverListener={expanded} arrow>
                                <Typography
                                    fontSize={14}
                                    fontWeight="bold"
                                    color="white"
                                    sx={
                                        underlineColor && {
                                            textDecoration: 'underline',
                                            textDecorationColor: underlineColor,
                                            textDecorationThickness: '2px',
                                        }
                                    }
                                >
                                    {`${expanded ? `${fieldName}:` : ''} ${formatToString(entity.properties[field], type, format)}`}
                                </Typography>
                            </Tooltip>
                        </Grid>
                    </>
                );
            })}
        </>
    );
};
