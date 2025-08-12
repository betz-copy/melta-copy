import { FormikProps } from 'formik';
import React from 'react';
import {  IChildTemplateForm } from '../../../interfaces/childTemplates';
import {  IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';


interface IFieldsAndFiltersTableProps {
    formikProps: FormikProps<IChildTemplateForm>;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ formikProps, entityTemplate }) => {

    return ();
};

export default FieldsAndFiltersTable;
