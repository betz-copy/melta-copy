import React, { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
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
import { EntityTemplateWizardValues } from '.';

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});

interface FormInputWithIndex {
    index: number;
    properties: CommonFormInputProperties;
}

interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>> {
    propertiesType: PropertiesType;
    values: Values;
    initialValues: Values | undefined;
    setFieldValue: FormikHelpers<Values>['setFieldValue'];
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    setBlock: StepComponentHelpers['setBlock'];
    isError: StepComponentHelpers['isError'];
    setIsError: StepComponentHelpers['setIsError'];
    title: string;
    addPropertyButtonLabel: string;
    touched: FormikTouched<Values> | undefined;
    errors: FormikErrors<Values> | undefined;
    initialFieldCardDataOnAdd?: Omit<CommonFormInputProperties, 'id'>;
    supportSerialNumberType: boolean;
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
    supportArrayFields: boolean;
    draggable?: { isDraggable: false } | { isDraggable: true; dragHandleProps: DraggableProvided['dragHandleProps'] };
}

const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
    propertiesType,
    values,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    isError,
    setIsError,
    title,
    addPropertyButtonLabel,
    touched,
    errors,
    supportSerialNumberType,
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
    supportArrayFields,
    draggable = { isDraggable: false },
    initialFieldCardDataOnAdd = {
        name: '',
        title: '',
        type: '',
        required: false,
        preview: false,
        hide: false,
        unique: false,
        options: [],
        optionColors: {},
        pattern: '',
        patternCustomErrorMessage: '',
        dateNotification: undefined,
        serialStarter: 0,
    },
}: React.PropsWithChildren<FieldBlockProps<PropertiesType, Values>>) => {
    // copy of values of formik in order to show changes on inputs fast (formik rerenders are slow)
    const [displayValues, setDisplayValues] = React.useState(values[propertiesType]);
    const [removedProperties, setRemovedProperties] = useState<FormInputWithIndex[]>([]);
    const [showAreUSureDialogForRemoveProperty, setShowAreUSureDialogForRemoveProperty] = useState(false);
    const [selectedIndexToRemove, setSelectedIndexForRemove] = useState(-1);

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

    const onDeleteSure = () => {
        setShowAreUSureDialogForRemoveProperty(false);
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(selectedIndexToRemove, 1);
        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const remove = (index: number, isNewProperty: Boolean) => {
        if (areThereAnyInstances && !isNewProperty) {
            setShowAreUSureDialogForRemoveProperty(true);
            setSelectedIndexForRemove(index);
            const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

            setRemovedProperties((prevRemovedProperties) => {
                // Clone the previous array of properties and add the new value to it
                const updatedProperties = [...prevRemovedProperties, { index, properties: displayValuesCopy[index] }];
                return updatedProperties;
            });
        } else onDeleteSure();
    };

    const move = (dst: number, src?: number, prop?: CommonFormInputProperties) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(dst, 0, prop || displayValuesCopy.splice(src || 0, 1)[0]);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    useEffect(() => {
        if (isError) {
            setIsError?.(false);
            if (removedProperties.length > 0) removedProperties.forEach((prop, index) => move(prop.index + index, undefined, prop.properties));
        }
    }, [isError]);

    const setFieldDisplayValue = (index: number, field: keyof Values, value: any) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy[index] = { ...displayValuesCopy[index], [field]: value };

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
        setFieldDisplayValue(index, inputName as keyof Values, inputValue);
    };

    const onChangeWrapper = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => onChange(index, event);
    const setFieldDisplayValueWrapper = (index: number) => (field: keyof Values, value: any) => setFieldDisplayValue(index, field, value);
    const setDisplayValueWrapper = (index: number) => (value: SetStateAction<CommonFormInputProperties>) => setDisplayValue(index, value);

    const isFieldBlockError = Boolean(touched?.[propertiesType]) && Boolean(errors?.[propertiesType]);

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
                                                supportEntityReferenceType,
                                                supportChangeToRequiredWithInstances,
                                                supportArrayFields,
                                            };

                                            if (propertiesType === 'properties' || propertiesType === 'detailsProperties') {
                                                return (
                                                    <MemoFieldEditCard
                                                        {...props}
                                                        key={property.id}
                                                        setFieldValue={setFieldDisplayValueWrapper(index) as FieldEditCardProps['setFieldValue']}
                                                        setValues={setDisplayValueWrapper(index)}
                                                    />
                                                );
                                            }

                                            // eslint-disable-next-line react/jsx-key
                                            return <MemoAttachmentEditCard {...props} key={property.id} />;
                                        })}

                                        {droppableProvided.placeholder}
                                        <Button
                                            type="button"
                                            variant="contained"
                                            style={{ margin: '8px' }}
                                            onClick={() => push({ id: uuid(), ...initialFieldCardDataOnAdd })}
                                        >
                                            <Typography>{addPropertyButtonLabel}</Typography>
                                        </Button>

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
                // ${selectedIndexToRemove > -1 && displayValues[selectedIndexToRemove].title}
                body={
                    <Typography>{`${i18next.t('systemManagement.warningOnDeleteField')}
                    ${i18next.t('systemManagement.continueWarningOnDeleteField')} ${
                        (values as unknown as EntityTemplateWizardValues & { _id: string })._id
                    }`}</Typography>
                }
                onYes={onDeleteSure}
            />
        </FieldBlockAccordion>
    );
};

export default FieldBlock;
