import React, { SetStateAction, useCallback, useRef } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Typography } from '@mui/material';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { FieldArray, FormikErrors, FormikHandlers, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '.';
import { MemoFieldEditCard } from './FieldEditCard';
import { MemoAttachmentEditCard } from './AttachmentEditCard';
import { StepComponentHelpers } from '..';

interface FieldBlockProps {
    propertiesType: 'properties' | 'attachmentProperties';
    values: EntityTemplateWizardValues;
    initialValues: EntityTemplateWizardValues;
    setFieldValue: FormikHelpers<EntityTemplateWizardValues>['setFieldValue'];
    handleChange: FormikHandlers['handleChange'];
    areThereAnyInstances: boolean;
    isEditMode: boolean;
    setBlock: StepComponentHelpers['setBlock'];
    title: string;
    addPropertyButtonLabel: string;
    touched: FormikTouched<EntityTemplateWizardValues>;
    errors: FormikErrors<EntityTemplateWizardValues>;
}

const FieldBlock: React.FC<FieldBlockProps> = ({
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
}) => {
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

    const push = (properties: EntityTemplateFormInputProperties) => {
        setDisplayValues([...displayValuesRef.current, properties]);
        updateFormik();
    };

    const remove = (index: number) => {
        const displayValuesCopy = [...displayValuesRef.current];

        displayValuesCopy.splice(index, 1);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const move = (src: number, dst: number) => {
        const displayValuesCopy = [...displayValuesRef.current];

        displayValuesCopy.splice(dst, 0, displayValuesCopy.splice(src, 1)[0]);

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const setFieldDisplayValue = (index: number, field: keyof EntityTemplateFormInputProperties, value: any) => {
        const displayValuesCopy = [...displayValuesRef.current];

        displayValuesCopy[index] = { ...displayValuesCopy[index], [field]: value };

        setDisplayValues(displayValuesCopy);
        updateFormik();
    };

    const setDisplayValue = (index: number, valueOrFunc: SetStateAction<EntityTemplateFormInputProperties>) => {
        const displayValuesCopy = [...displayValuesRef.current];

        let value: EntityTemplateFormInputProperties;
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

        setFieldDisplayValue(index, inputName as keyof EntityTemplateFormInputProperties, inputValue);
    };

    const onChangeWrapper = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => onChange(index, event);
    const setFieldDisplayValueWrapper = (index: number) => (field: keyof EntityTemplateFormInputProperties, value: any) =>
        setFieldDisplayValue(index, field, value);
    const setDisplayValueWrapper = (index: number) => (value: SetStateAction<EntityTemplateFormInputProperties>) => setDisplayValue(index, value);

    return (
        <Accordion
            style={{
                width: '100%',
                boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
                marginBottom: '10px',
            }}
        >
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
                                                initialValues,
                                                areThereAnyInstances,
                                                touched: touched[propertiesType]?.[index],
                                                errors: errors[propertiesType]?.[index] as
                                                    | FormikErrors<EntityTemplateFormInputProperties>
                                                    | undefined,
                                                remove,
                                                onChange: onChangeWrapper(index),
                                            };

                                            if (propertiesType === 'properties') {
                                                return (
                                                    <MemoFieldEditCard
                                                        {...props}
                                                        key={property.id}
                                                        setFieldValue={setFieldDisplayValueWrapper(index)}
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
                                            onClick={() =>
                                                push({
                                                    id: uuid(),
                                                    name: '',
                                                    title: '',
                                                    type: '',
                                                    required: false,
                                                    preview: false,
                                                    hide: false,
                                                    unique: false,
                                                    options: [],
                                                    pattern: '',
                                                    patternCustomErrorMessage: '',
                                                })
                                            }
                                        >
                                            <Typography>{addPropertyButtonLabel}</Typography>
                                        </Button>

                                        {errors.properties === i18next.t('validation.oneField') && (
                                            <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                                        )}
                                    </Grid>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </FieldArray>
            </AccordionDetails>
        </Accordion>
    );
};

export default FieldBlock;
