import { Button, Grid, TextField, Typography } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { Add } from '@mui/icons-material';
import { IFilterRelationReference } from '../commonInterfaces';

export interface FieldEditCardProps {
    values: Record<string, IFilterRelationReference>;
    index?: number;
}

export const FilterEntitiesByCriteria: React.FC<FieldEditCardProps> = ({ values, index }) => {
    // const queryClient = useQueryClient();

    const filterField = `properties[${index}].relationshipReference.filterField`;
    const filterBy = `properties[${index}].relationshipReference.filterBy`;
    const filterValue = `properties[${index}].relationshipReference.filterValue`;

    return (
        <Grid container direction="column" gap="0.8rem">
            <Grid container wrap="nowrap">
                <TextField
                    label={i18next.t('wizard.entityTemplate.filterField')}
                    id={filterField}
                    name={filterField}
                    // value={value.filterField}
                    // onChange={onChange}
                    // error={touchedName && Boolean(errorName)}
                    // helperText={touchedName && errorName}
                    // disabled={value.deleted}
                    sx={{ marginRight: '5px' }}
                    fullWidth
                />
                <TextField
                    label={i18next.t('wizard.entityTemplate.filterBy')}
                    id={filterBy}
                    name={filterBy}
                    // value={value.filterBy}
                    // onChange={onChange}
                    // error={touchedTitle && Boolean(errorTitle)}
                    // helperText={touchedTitle && errorTitle}
                    sx={{ marginRight: '5px' }}
                    fullWidth
                    // disabled={value.deleted}
                />
                <TextField
                    label={i18next.t('wizard.entityTemplate.filterValue')}
                    id={filterValue}
                    name={filterValue}
                    // value={value.filterValue}
                    // onChange={onChange}
                    // error={touchedName && Boolean(errorName)}
                    // helperText={touchedName && errorName}
                    // disabled={isDisabled || value.deleted}
                    sx={{ marginRight: '5px' }}
                    fullWidth
                />
            </Grid>
            <Button type="button" variant="text" style={{ alignSelf: 'start' }}>
                <Typography style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.625rem' }}>
                    <Add />
                    {i18next.t('wizard.entityTemplate.addRelationFilter')}
                </Typography>
            </Button>
        </Grid>
    );
};
