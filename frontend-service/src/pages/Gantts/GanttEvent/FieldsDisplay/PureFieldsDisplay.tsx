import { Grid, Tooltip, Typography } from '@mui/material';
import React, { CSSProperties, Fragment } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { environment } from '../../../../globals';
import { formatToString } from '../../../../common/EntityProperties';

const { ganttSettings } = environment;

export interface IPureFieldsDisplayProps {
    fields: string[];
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    textStyle: CSSProperties;
    underlineColor?: CSSProperties['color'];
    expanded?: boolean;
}

export const PureFieldsDisplay: React.FC<IPureFieldsDisplayProps> = ({ fields, entity, entityTemplate, textStyle, underlineColor, expanded }) => {
    return (
        <>
            {fields.map((field, index) => {
                const { title: fieldName, type, format } = entityTemplate.properties.properties[field];

                return (
                    <Fragment key={field}>
                        {!expanded && Boolean(index) && (
                            <Grid item>
                                <Typography fontSize={14} sx={{ ...textStyle }}>
                                    {ganttSettings.separators.field}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item>
                            <Tooltip title={`${fieldName} (${entityTemplate.displayName})`} placement="top" disableHoverListener={expanded} arrow>
                                <Typography
                                    fontSize={14}
                                    sx={{
                                        textDecoration: underlineColor && 'underline',
                                        textDecorationColor: underlineColor,
                                        textDecorationThickness: '2px',
                                        ...textStyle,
                                    }}
                                >
                                    {`${expanded ? `${fieldName}:` : ''} ${formatToString(entity.properties[field], type, format)}`}
                                </Typography>
                            </Tooltip>
                        </Grid>
                    </Fragment>
                );
            })}
        </>
    );
};
