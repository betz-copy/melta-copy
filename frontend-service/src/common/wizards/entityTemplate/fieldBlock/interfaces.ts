import { Accordion, styled } from '@mui/material';
import { IUniqueConstraintOfTemplate } from '@packages/entity';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import _debounce from 'lodash.debounce';
import React, { SetStateAction } from 'react';
import { StepComponentHelpers } from '../..';
import { PropertiesTypes } from '../AddFields';
import { CommonFormInputProperties, GroupProperty, PropertyItem } from '../commonInterfaces';
import { FieldEditCardProps } from '../FieldEditCard';

export const ItemTypes = {
    FIELD: 'field',
    GROUP: 'group',
    STEP: 'step',
    PROPERTY: 'property',
};

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});

export interface FieldProps {
    field: CommonFormInputProperties;
    values: Record<string, PropertyItem[]>;
    index: number;
    parentId: string | null;
    onDrop: (item: any, toIndex: number, toGroupId: string | null) => void;
    buildProps: Omit<FieldEditCardProps, 'setFieldValue'>;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    setValues: (value: SetStateAction<CommonFormInputProperties>) => void;
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
    moveGroup?: (group: GroupProperty, toIndex: number, toGroupId?: string | null) => void;
}

export interface GroupProps<PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>> {
    group: GroupProperty;
    values: Values;
    index: number;
    moveField: (item: CommonFormInputProperties, toIndex: number, toGroupId: string | null) => void;
    moveGroup?: (group: GroupProperty, toIndex: number, toGroupId?: string | null) => void;
    touched: FormikTouched<Values> | undefined;
    errors: FormikErrors<Values> | undefined;
    propertiesType: PropertiesType;
    onChangeGroupData: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, groupId: string) => void;
    remove: (index: number) => void;
    uniqueConstraints: IUniqueConstraintOfTemplate[] | undefined;
    setUniqueConstraints: ((uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void) | undefined;
    setFieldDisplayValueWrapper: (index: number, groupIndex?: number) => (field: keyof Values, value: any) => void;
    setDisplayValueWrapper: (index: number, groupId?: string) => (value: SetStateAction<CommonFormInputProperties>) => void;
    buildProps: any;
    addFieldToGroup: (item: GroupProperty) => void;
    addPropertyButtonLabel: string;
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    initialValue?: PropertyItem;
}

export interface AttachmentsProps {
    field: CommonFormInputProperties;
    index: number;
    buildProps: any;
    onDrop: (item: CommonFormInputProperties, toIndex: number, toGroupId: string | null) => void;
}

export interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>> {
    propertiesType: PropertiesType;
    values: Values;
    uniqueConstraints?: IUniqueConstraintOfTemplate[];
    setUniqueConstraints?: (uniqueConstraints: SetStateAction<IUniqueConstraintOfTemplate[]>) => void;
    initialValues: Values | undefined;
    setFieldValue: FormikHelpers<Values>['setFieldValue'];
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    setBlock: StepComponentHelpers['setBlock'];
    title: string;
    addPropertyButtonLabel: string;
    touched: FormikTouched<Values> | undefined;
    errors: FormikErrors<Values> | undefined;
    initialFieldCardDataOnAdd?: Omit<CommonFormInputProperties, 'id'>;
    initialGroupCardDataOnAdd?: GroupProperty;
    supportSerialNumberType: boolean;
    supportUserType: boolean;
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
    supportArrayFields: boolean;
    supportDeleteForExistingInstances: boolean;
    supportRelationshipReference: boolean;
    supportEditEnum?: boolean;
    supportUnique?: boolean;
    supportLocation?: boolean;
    supportArchive?: boolean;
    locationSearchFields?: { show: boolean; disabled: boolean };
    supportAddFieldButton?: boolean;
    hasActions?: boolean;
    draggable?: { isDraggable: boolean };
    supportConvertingToMultipleFields?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
    supportComment?: boolean;
    userPropertiesInTemplate?: string[];
    archive?: (index: number, groupIndex?: number) => void;
    remove?: (
        index: number,
        isNewProperty: boolean,
        propertiesType: PropertiesTypes,
        setShowAreUSureDialogForRemoveProperty: (v: boolean) => void,
        groupIndex?: number,
    ) => void;
    onDeleteSure?: (setShowAreUSureDialogForRemoveProperty: (v: boolean) => void) => void;
}
