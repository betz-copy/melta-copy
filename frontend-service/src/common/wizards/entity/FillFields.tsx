import React from 'react';
import * as Yup from 'yup';
import i18next from 'i18next';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { objectFilter } from '../../../utils/object';
import { EntityPropertiesInput } from '../../inputs/EntityPropertiesInput';

const fillFieldsSchema = {
    properties: Yup.object().required(i18next.t('validation.required')),
};

const FillFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue }) => {
    const propertiesWithoutFiles = objectFilter(values.template.properties.properties, (_key, value) => value.format !== 'fileId');

    const schema = {
        ...values.template.properties,
        properties: propertiesWithoutFiles,
    };

    return <EntityPropertiesInput schema={schema} values={values} setFieldValue={setFieldValue} />;
};

export { FillFields, fillFieldsSchema };
