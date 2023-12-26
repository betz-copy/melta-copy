import React, { SetStateAction, useCallback, useRef } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, styled, Typography } from '@mui/material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { FieldEditCardProps, MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';
import { CommonFormInputProperties } from './commonInterfaces';

export const FieldBlockAccordion = styled(Accordion)({
    width: '100%',
    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
    marginBottom: '10px',
});

interface FieldBlockProps<PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>> {
    propertiesType: PropertiesType;
    values: Values;
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
    supportEntityReferenceType: boolean;
    supportChangeToRequiredWithInstances: boolean;
}

const FieldBlock = <PropertiesType extends string, Values extends Record<PropertiesType, CommonFormInputProperties[]>>({
    propertiesType,
    values,
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
    supportEntityReferenceType,
    supportChangeToRequiredWithInstances,
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

    const remove = (index: number) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(index, 1);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const move = (src: number, dst: number) => {
        const displayValuesCopy = [...displayValuesRef.current] as Values[PropertiesType];

        displayValuesCopy.splice(dst, 0, displayValuesCopy.splice(src, 1)[0]);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

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
                <Typography>{title}</Typography>
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
        </FieldBlockAccordion>
    );
};

export default FieldBlock;
