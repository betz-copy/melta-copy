import i18next from 'i18next';
import * as Yup from 'yup';
import { TableMetaData } from '../../interfaces/dashboard';

export const tableDetailsSchema = Yup.object().shape({
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
});

export const dashboardInitialValues = {
    table: { templateId: '', name: '', description: '', columns: [], columnsOrder: [], filter: {} } as TableMetaData,
};
