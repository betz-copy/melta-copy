import React from 'react';
import * as Yup from 'yup';
import i18next from 'i18next';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { objectFilter } from '../../../utils/object';
import { EntityFilesInput } from '../../inputs/EntityFilesInput';

const fileFieldsSchema = {
    attachmentsProperties: Yup.object().required(i18next.t('validation.required')),
};

const FileFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue, errors }) => {
    const filesProperties = objectFilter(values.template.properties.properties, (_key, value) => value.format === 'fileId');
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
