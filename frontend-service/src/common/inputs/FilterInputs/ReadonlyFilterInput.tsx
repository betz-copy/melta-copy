import { Grid } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { ViewModeTextField } from '../ViewModeTextField';

export const getFilterFieldReadonly = (filter: IGraphFilterBody['filterField'], fieldTemplateType: string) => {
    switch (filter?.filterType) {
        case 'date':
            return `${i18next.t(`filters.${filter.filterType}.${filter.type}`)} ${
                filter.dateFrom ? new Date(filter.dateFrom).toLocaleDateString('he-IL') : ''
            } ${filter.dateTo ? ` ${i18next.t('dashboard.to')}  ${new Date(filter.dateTo).toLocaleDateString('he-IL')}` : ''}`;
        case 'number':
        case 'text':
            if (fieldTemplateType === 'boolean')
                return `${i18next.t(`filters.${filter.type}`)} ${filter.filter ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no')}`;
            return `${i18next.t(`filters.${filter.filterType === 'text' ? 'string' : filter.filterType}.${filter.type}`)}  ${filter.filter}`;
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
            <Grid item>
                <ViewModeTextField label={i18next.t('dashboard.field')} value={title} readOnly />
            </Grid>
            <Grid item flexWrap="wrap">
                <ViewModeTextField label={i18next.t('dashboard.filter')} value={getFilterFieldReadonly(filterField, type)} readOnly multiline />
            </Grid>
        </Grid>
    );
};

export { ReadOnlyFilterInput };
