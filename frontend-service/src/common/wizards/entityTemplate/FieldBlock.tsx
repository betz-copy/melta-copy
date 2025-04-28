import React, { SetStateAction, useCallback, useMemo, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, styled, Typography } from '@mui/material';
import { DragDropContext, DraggableProvided, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { FieldEditCardProps, MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';
import { CommonFormInputProperties } from './commonInterfaces';
import { AreYouSureDialog } from '../../dialogs/AreYouSureDialog';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IUniqueConstraintOfTemplate } from '../../../interfaces/entities';

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});

interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>> {
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
    draggable?: { isDraggable: false } | { isDraggable: true; dragHandleProps: DraggableProvided['dragHandleProps'] };
    supportConvertingToMultipleFields?: boolean;
    supportIdentifier?: boolean;
    hasIdentifier?: boolean;
}

const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
    propertiesType,
    values,
    uniqueConstraints,
    setUniqueConstraints,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportUserType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    supportDeleteForExistingInstances,
    supportRelationshipReference,
    supportEditEnum,
    supportUnique,
    supportLocation,
    supportArchive,
    locationSearchFields,
    supportIdentifier,
    hasIdentifier,
    supportAddFieldButton = true,
    hasActions,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        groupName: undefined,
        uniqueCheckbox: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        calculateTime: undefined,
        relationshipReference: undefined,
        expandedUserField: undefined,
        serialStarter: 0,
        archive: false,
        mapSearch: false,
    },
    supportConvertingToMultipleFields = true,
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    const [displayValues, setDisplayValues] = React.useState(values[propertiesType]);

    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    const [selectedIndexesToRemove, setSelectedIndexesForRemove] = useState<number[]>([]);

    // using displayValues ref because update functions (push/remove/...) are not updated for the field cards on
    // every re-render and if displayValues changes, it does not update in the functions of the field cards.
    // therefore using a reference for them to always use the current displayValues.
    const displayValuesRef = useRef(displayValues);
    displayValuesRef.current = displayValues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateFormikDebounced = useCallback(
        _debounce(() => {
            setFieldValue(propertiesType, [...displayValuesRef.current], true);
            setBlock(false);
        }, 1000),
        [],
    );

    const updateFormik = () => {
        setBlock(true);
        updateFormikDebounced();
    };

    const push = (properties: CommonFormInputProperties) => {
        setDisplayValues([...displayValuesRef.current, properties] as Values[PropertiesType]);
        updateFormik();
    };

    const setFieldDisplayValue = (indexes: number[], field: keyof Values, value: any) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        indexes.forEach((index) => {
            displayValuesCopy[index] = { ...displayValuesCopy[index], [field]: value };
        });

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const onDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        setFieldDisplayValue(selectedIndexesToRemove, 'deleted' as keyof Values, true);
    };

    const remove = (index: number, isNewProperty: Boolean) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];
        const isDeleted = displayValuesCopy[index].deleted;

        const removedProperty = displayValuesCopy[index];

        if (isDeleted) {
            const indexesToUpdate = [index];

            if (removedProperty.type === 'kartoffelUserField') {
                const userFieldIndex = displayValuesCopy.findIndex(
                    (property) =>
                        property.type === 'user' && removedProperty.expandedUserField?.relatedUserField === property.name && property.deleted,
                );

                if (userFieldIndex !== -1) indexesToUpdate.push(userFieldIndex);
            }

            setFieldDisplayValue(indexesToUpdate, 'deleted' as keyof Values, false);
        } else if (areThereAnyInstances && !isNewProperty) {
            setShowAreUSureDialogForRemoveProperty(true);
            const indexesToUpdate = [index];
            if (removedProperty.type === 'user') {
                displayValuesCopy.forEach((property, propIndex) => {
                    if (property.type === 'kartoffelUserField' && property.expandedUserField?.relatedUserField === removedProperty.name) {
                        indexesToUpdate.push(propIndex);
                    }
                });
            }

            setSelectedIndexesForRemove(indexesToUpdate);
        } else {
            displayValuesCopy.splice(index, 1);
            if (removedProperty.type === 'user') {
                displayValuesCopy.forEach((property, propIndex) => {
                    if (property.type === 'kartoffelUserField' && property.expandedUserField?.relatedUserField === removedProperty.name) {
                        displayValuesCopy.splice(propIndex, 1);
                    }
                });
            }
            setDisplayValues(displayValuesCopy);
            updateFormik();
        }
    };

    const move = (src: number, dst: number) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(dst, 0, displayValuesCopy.splice(src, 1)[0]);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const setDisplayValue = (index: number, valueOrFunc: SetStateAction<CommonFormInputProperties>) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        let value: CommonFormInputProperties;
        if (typeof valueOrFunc === 'function') {
            value = valueOrFunc(displayValuesCopy[index]);
        } else {
            value = valueOrFunc;
        }

        displayValuesCopy[index] = value;
        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const onChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const inputName = event.target.name.split('.')[1]; // the input name is in the format `properties[index].field`
        const inputValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setFieldDisplayValue([index], inputName as keyof Values, inputValue);
    };
    const onChangeWrapper = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => onChange(index, event);
    const setFieldDisplayValueWrapper = (index: number) => (field: keyof Values, value: any) => setFieldDisplayValue([index], field, value);
    const setDisplayValueWrapper = (index: number) => (value: SetStateAction<CommonFormInputProperties>) => setDisplayValue(index, value);
    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

    const userPropertiesInTemplate = useMemo(
        () => values[propertiesType].filter(({ type, deleted }) => type === 'user' && !deleted).map(({ name }) => name),
        [propertiesType, values],
    );

    const onDuplicateKartoffelField = (fieldIndex: number) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];
        displayValuesCopy.splice(fieldIndex + 1, 0, {
            id: uuid(),
            ...initialFieldCardDataOnAdd,
            type: 'kartoffelUserField',
            readOnly: true,
            expandedUserField: {
                relatedUserField: displayValues[fieldIndex].expandedUserField?.relatedUserField || '',
                kartoffelField: '',
            },
        });

        setDisplayValues(displayValuesCopy);
    };

    return (
        <FieldBlockAccordion style={{ border: isFieldBlockError ? '1px solid red' : '' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container wrap="nowrap" alignItems="center">
                    {draggable.isDraggable && (
                        <Box {...draggable.dragHandleProps} style={{ display: 'flex', alignItems: 'center' }}>
                            <DragHandleIcon fontSize="large" />
                        </Box>
                    )}
                    <Typography>{title}</Typography>
                </Grid>
            </AccordionSummary>

            <AccordionDetails>
                <FieldArray name={propertiesType}>
                    {() => (
                        <DragDropContext onDragEnd={(result) => result.destination && move(result.source.index, result.destination.index)}>
                            <Droppable droppableId="fieldArea">
                                {(droppableProvided) => (
                                    <Grid
                                        container
                                        ref={droppableProvided.innerRef}
                                        {...droppableProvided.droppableProps}
                                        direction="column"
                                        alignItems="center"
                                    >
                                        {displayValues.map((property, index) => {
                                            const props = {
                                                entity: (values as any).displayName,
                                                value: property,
                                                index,
                                                isEditMode,
                                                initialValue: initialValues?.[propertiesType].find(({ id }) => property.id === id),
                                                areThereAnyInstances,
                                                touched: touched?.[propertiesType]?.[index],
                                                errors: errors?.[propertiesType]?.[index] as FormikErrors<CommonFormInputProperties> | undefined,
                                                remove,
                                                onChange: onChangeWrapper(index),
                                                supportSerialNumberType,
                                                supportUserType,
                                                supportEntityReferenceType,
                                                supportChangeToRequiredWithInstances,
                                                templateId: (values as any)._id,
                                                supportArrayFields,
                                                supportDeleteForExistingInstances,
                                                supportEditEnum,
                                                supportRelationshipReference,
                                                supportUnique,
                                                supportLocation,
                                                supportArchive,
                                                supportIdentifier,
                                                hasIdentifier,
                                                locationSearchFields,
                                                hasActions,
                                                supportConvertingToMultipleFields,
                                                userPropertiesInTemplate,
                                                onDuplicateKartoffelField,
                                            };

                                            if (
                                                propertiesType === 'properties' ||
                                                propertiesType === 'detailsProperties' ||
                                                propertiesType === 'archiveProperties'
                                            ) {
                                                return (
                                                    <MemoFieldEditCard
                                                        {...props}
                                                        key={property.id}
                                                        setFieldValue={setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']}
                                                        setValues={setDisplayValueWrapper(index)}
                                                        uniqueConstraints={uniqueConstraints}
                                                        setUniqueConstraints={setUniqueConstraints}
                                                    />
                                                );
                                            }

                                            // eslint-disable-next-line react/jsx-key
                                            return <MemoAttachmentEditCard {...props} key={property.id} />;
                                        })}

                                        {droppableProvided.placeholder}
                                        {supportAddFieldButton && (
                                            <Button
                                                type="button"
                                                variant="contained"
                                                style={{ margin: '8px' }}
                                                onClick={() => push({ id: uuid(), ...initialFieldCardDataOnAdd })}
                                            >
                                                <Typography>{addPropertyButtonLabel}</Typography>
                                            </Button>
                                        )}

                                        {errors?.[propertiesType] === i18next.t('validation.oneField') && (
                                            <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                                        )}
                                    </Grid>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </FieldArray>
            </AccordionDetails>
            <AreYouSureDialog
                open={showAreUSureDialogForRemoveProperty}
                handleClose={() => setShowAreUSureDialogForRemoveProperty(false)}
                title={i18next.t('systemManagement.deleteField')}
                body={`${i18next.t('systemManagement.warningOnDeleteField')}
                    ${selectedIndexesToRemove.length > 0 && displayValuesRef.current[selectedIndexesToRemove[0]].title}
                    ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                    (initialValues as unknown as IMongoEntityTemplatePopulated)?.displayName
                }`}
                onYes={onDeleteSure}
            />
        </FieldBlockAccordion>
    );
};

export default FieldBlock;
