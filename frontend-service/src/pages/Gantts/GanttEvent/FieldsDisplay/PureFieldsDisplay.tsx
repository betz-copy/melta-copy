import { Grid, Typography } from '@mui/material';
import React, { CSSProperties, Fragment } from 'react';
import { formatToString } from '../../../../common/EntityProperties';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import { environment } from '../../../../globals';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

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
                const property = entityTemplate.properties.properties[field];
                const { title: fieldName } = property;

                return (
                    <Fragment key={field}>
                        {!expanded && Boolean(index) && (
                            <Grid>
                                <Typography fontSize={14} sx={{ ...textStyle }}>
                                    {ganttSettings.separators.field}
                                </Typography>
                            </Grid>
                        )}

                        <Grid>
                            <MeltaTooltip title={`${fieldName} (${entityTemplate.displayName})`} placement="top" disableHoverListener={expanded}>
                                <Typography
                                    fontSize={14}
                                    sx={{
                                        textDecoration: underlineColor && 'underline',
                                        textDecorationColor: underlineColor,
                                        textDecorationThickness: '2px',
                                        ...textStyle,
                                    }}
                                >
                                    {`${expanded ? `${fieldName}:` : ''} ${formatToString(
                                        entity.properties[field],
                                        property,
                                        field,
                                        undefined,
                                        undefined,
                                        {
                                            pureString: true,
                                        },
                                    )}`}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Fragment>
                );
            })}
        </>
    );
};
