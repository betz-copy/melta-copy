import React, { Dispatch } from 'react';
import { IMongoCategory } from '../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { StepComponentProps } from '..';
import { IFrameWizardValues } from '.';
import { SelectCheckbox, SelectCheckboxProps } from '../../SelectCheckbox';

const getCategoriesSelectCheckboxGroupProps = (
    categories: IMongoCategory[] | undefined,
): SelectCheckboxProps<IMongoEntityTemplatePopulated, IMongoCategory>['groupsProps'] => {
    if (!categories) {
        return {
            useGroups: false,
        };
    }

    return {
        useGroups: true,
        groups: categories,
        getGroupId: (category) => category._id,
        getGroupLabel: (category) => category.displayName,
        getGroupOfOption: (entityTemplate, _categories) => entityTemplate.category,
    };
};

const SettingIFramesPermissions: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    // React.FC<{
    // title: string;
    // templates: IMongoEntityTemplatePopulated[];
    // selectedTemplates: IMongoEntityTemplatePopulated[];
    // setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    // categories?: any[];
    // isDraggableDisabled?: boolean;
    // setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    // size?: 'small' | 'medium';
    // toTopBar?: boolean;
    // }> = () => {
    console.log({ values, touched, errors, handleChange });

    return (
        <SelectCheckbox
            title="title"
            options={values.categoryIds}
            // selectedOptions={selectedTemplates}
            // setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            groupsProps={getCategoriesSelectCheckboxGroupProps(categories)}
            // isDraggableDisabled={isDraggableDisabled}
            // setOptions={setTemplates}
            // size={size}
            // toTopBar={toTopBar}
        />
    );
};y

export default SettingIFramesPermissions;
