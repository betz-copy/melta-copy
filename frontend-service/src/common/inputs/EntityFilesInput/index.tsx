import React from 'react';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityFileInput } from './entityFileInput';

export const EntityFilesInput: React.FC<{
    setFieldValue: (field: string, value: File | undefined) => void;
    requiredFilesNames: any;
    errors: any;
    values: any;
    filesProperties: IMongoEntityTemplatePopulated['properties']['properties'];
}> = ({ filesProperties, setFieldValue, requiredFilesNames, errors, values }) => {
    return (
        <>
            {Object.entries(filesProperties).map(([key, value]) => (
                <EntityFileInput
                    key={key}
                    fieldName={key}
                    value={value}
                    setFieldValue={setFieldValue}
                    required={requiredFilesNames.includes(key)}
                    values={values}
                    errors={errors}
                />
            ))}
        </>
    );
};
