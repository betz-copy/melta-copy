import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
// import { environment } from '../../../globals';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { ViewModeTextField } from '../ViewModeTextField';

// const { fixedDateFilterNames } = environment;

export const getFilterFieldReadonly = (filter: IGraphFilterBody['filterField'], fieldTemplateType: string) => {
    switch (filter?.filterType) {
        case 'date':
            // if (fixedDateFilterNames.includes(filter.type)) {
            //     return `${i18next.t(`filters.${filter.type}`)}`;
            // }
            return `${i18next.t(`filters.${filter.filterType}.${filter.type}`)} ${
                filter.dateFrom ? new Date(filter.dateFrom).toLocaleDateString('he-IL') : ''
            } ${filter.dateTo ? ` ${i18next.t('dashboard.to')}  ${new Date(filter.dateTo).toLocaleDateString('he-IL')}` : ''}`;
        case 'number':
        case 'text':
            if (fieldTemplateType === 'boolean')
                return `${i18next.t(`filters.${filter.type}`)} ${filter.filter ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no')}`;
            return `${i18next.t(`filters.${filter.filterType}.${filter.type}`)}  ${filter.filter}`;
        case 'set':
            return `${i18next.t('filters.contains')} ${filter.values?.map((val) => (val === null ? i18next.t('filters.empty') : val)).join(', ')}`;
        default:
            return '';
    }
};

const ReadOnlyFilterInput: React.FC<{ filterField: IGraphFilterBody['filterField']; selectedProperty: { title: string; type: string } }> = ({
    filterField,
    selectedProperty: { title, type },
}) => {
    return (
        <Grid container direction="row" flexWrap="nowrap">
            <Grid>
                <ViewModeTextField label={i18next.t('dashboard.field')} value={title} readOnly />
            </Grid>
            <Grid flexWrap="wrap">
                <ViewModeTextField label={i18next.t('dashboard.filter')} value={getFilterFieldReadonly(filterField, type)} readOnly multiline />
            </Grid>
        </Grid>
    );
};

export { ReadOnlyFilterInput };
