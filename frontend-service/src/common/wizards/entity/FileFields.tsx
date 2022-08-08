import React from 'react';
import * as Yup from 'yup';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { EntityFilesInput } from '../../inputs/EntityFilesInput/index';

const fileFieldsSchema = {
    attachmentsProperties: Yup.object().required(i18next.t('validation.required')),
};

const FileFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue, errors }) => {
    const filesProperties = pickBy(values.template.properties.properties, (value) => value.format === 'fileId');
    const requiredFilesNames = values.template.properties.required.filter((name) => Object.keys(filesProperties).includes(name));

    return (
        <EntityFilesInput
            requiredFilesNames={requiredFilesNames}
            filesProperties={filesProperties}
            setFieldValue={setFieldValue}
            errors={errors}
            values={values}
        />
    );
};

export { FileFields, fileFieldsSchema };
