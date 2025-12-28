import { Delete as DeleteIcon, DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { AccordionDetails, AccordionSummary, Box, Button, Divider, Grid, IconButton, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDarkModeStore } from '../../../../stores/darkMode';
import MeltaTooltip from '../../../MeltaDesigns/MeltaTooltip';
import { MemoAttachmentEditCard } from '../AttachmentEditCard';
import { CommonFormInputProperties, FieldProperty, GroupProperty, PropertyItem } from '../commonInterfaces';
import { FieldEditCardProps, MemoFieldEditCard } from '../FieldEditCard';
import { AttachmentsProps, FieldBlockAccordion, FieldProps, GroupProps, ItemTypes } from './interfaces';

export const getFieldData = (displayValuesCopy: any, fieldIndex: number, groupIndex?: number) => {
    if (typeof groupIndex === 'number') return (displayValuesCopy[groupIndex] as GroupProperty)?.fields?.[fieldIndex];
    return (displayValuesCopy[fieldIndex] as FieldProperty)?.data;
};

export const Attachment = ({ field, index, buildProps, onDrop }: AttachmentsProps) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.FIELD,
        drop: (item: CommonFormInputProperties & { index: number }) => {
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;

            onDrop(item, hoverIndex, null);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.5 : 1,
        }),
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: let's keep it that way
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    return (
        <Grid
            style={{
                opacity,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity }}>
                <MemoAttachmentEditCard {...buildProps} dragRef={ref} key={field.id} />
            </div>
        </Grid>
    );
};

export const Field = ({
    field,
    onDrop,
    index,
    parentId,
    buildProps,
    setFieldValue,
    setValues,
    uniqueConstraints,
    setUniqueConstraints,
    moveGroup,
    values,
}: FieldProps) => {
    const ref = React.useRef(null);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        drop: (item: (CommonFormInputProperties | GroupProperty) & { index: number; parentId: string | null }) => {
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex && item.parentId === parentId) return;

            if (item.type === 'group' && moveGroup) moveGroup(item as GroupProperty, hoverIndex);

            onDrop(item, hoverIndex, parentId);

            item.index = hoverIndex;
            item.parentId = parentId;
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.FIELD,
        item: { ...field, index, parentId },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.5 : 1,
        }),
    });

    // biome-ignore lint/correctness/useExhaustiveDependencies: let's keep it
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    return (
        <Grid
            style={{
                opacity,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <Grid ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity }}>
                <MemoFieldEditCard
                    {...buildProps}
                    key={field.id}
                    setFieldValue={setFieldValue}
                    setValues={setValues}
                    uniqueConstraints={uniqueConstraints}
                    setUniqueConstraints={setUniqueConstraints}
                    values={values}
                />
            </Grid>
        </Grid>
    );
};

export const Group = <PropertiesType extends string, Values extends Record<PropertiesType, PropertyItem[]>>({
    group,
    index,
    values,
    moveField,
    moveGroup,
    touched,
    errors,
    propertiesType,
    onChangeGroupData,
    remove,
    uniqueConstraints,
    setUniqueConstraints,
    setFieldDisplayValueWrapper,
    setDisplayValueWrapper,
    buildProps,
    addFieldToGroup,
    addPropertyButtonLabel,
    areThereAnyInstances,
    isEditMode,
    initialValue,
}: React.PropsWithChildren<GroupProps<PropertiesType, Values>>) => {
    const ref = React.useRef(null);
    const isNewProperty = !initialValue;
    const [isGroupOpen, setIsGroupOpen] = useState(isNewProperty);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const groupName = `properties[${index}].name`;
    const touchedName = touched?.[propertiesType]?.[index]?.name;
    const errorName = (errors?.[propertiesType]?.[index] as GroupProperty)?.name;
    const displayName = `properties[${index}].displayName`;
    const touchedTitle = touched?.[propertiesType]?.[index]?.displayName;
    const errorTitle = (errors?.[propertiesType]?.[index] as GroupProperty)?.displayName;

    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    const isGroupFieldBlockError = Boolean(touched?.[propertiesType]?.[index]) && Boolean(errors?.[propertiesType]?.[index]);
    const [isExpanded, setIsExpanded] = useState(isNewProperty);

    const [, drop] = useDrop({
        accept: [ItemTypes.GROUP, ItemTypes.FIELD],
        drop(item: (CommonFormInputProperties | GroupProperty) & { index: number; parentId: string | null }, monitor) {
            if (!ref.current || !monitor.isOver({ shallow: true })) return;

            const hoverIndex = index;
            const isGroup = Array.isArray((item as GroupProperty).fields);

            if (isGroup) {
                const draggedIndex = item.index;
                if (draggedIndex !== hoverIndex && moveGroup) {
                    moveGroup(item as GroupProperty, hoverIndex);
                }
            } else {
                const fieldItem = item as CommonFormInputProperties & { index: number; parentId: string | null };
                if (isGroupOpen) {
                    if (group.fields.length === 0 && fieldItem.parentId !== group.id) {
                        moveField(fieldItem, 0, group.id);
                        fieldItem.index = 0;
                        fieldItem.parentId = group.id;
                    } else moveField(fieldItem, hoverIndex, group.id);
                } else moveField(fieldItem, hoverIndex, null);
            }
        },
    });

    const [{ isDragging, opacity }, drag, preview] = useDrag({
        type: ItemTypes.GROUP,
        item: { ...group, index },
        options: {
            dropEffect: 'copy',
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
            opacity: monitor.isDragging() ? 0.7 : 1,
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    drag(drop(ref));

    return (
        <Grid
            style={{
                cursor: 'grab',
                transition: isDragging ? 'none' : 'box-shadow 0.1s ease',
                opacity,
            }}
            ref={isExpanded ? ref : undefined}
        >
            <Grid
                style={{
                    opacity,
                    alignSelf: 'stretch',
                    marginBottom: '1rem',
                    cursor: 'grab',
                }}
            >
                <FieldBlockAccordion
                    sx={{
                        mb: 2,
                        padding: '0.5rem',
                        borderRadius: '12px',
                        backgroundColor: darkMode ? '#4a4a5033' : '#f4f6fa',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        border: isGroupFieldBlockError ? '1px solid red' : '',
                    }}
                    onChange={(_, expanded) => setIsExpanded(expanded)}
                    defaultExpanded={isNewProperty}
                >
                    <AccordionSummary
                        ref={!isExpanded ? ref : undefined}
                        expandIcon={<ExpandMoreIcon />}
                        onClick={() => setIsGroupOpen(!isGroupOpen)}
                        sx={{
                            '& .MuiAccordionSummary-content.Mui-expanded': {
                                margin: 0,
                            },
                            '&.Mui-focusVisible': {
                                backgroundColor: 'transparent',
                            },
                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                            '&.MuiAccordionSummary-root': {
                                backgroundColor: 'transparent',
                            },
                        }}
                    >
                        <Grid container wrap="nowrap" width="100%">
                            <Box style={{ display: 'flex', alignItems: 'center' }}>
                                <DragHandleIcon fontSize="large" />
                            </Box>

                            <TextField
                                label={i18next.t('wizard.entityTemplate.groupName')}
                                id={groupName}
                                name={groupName}
                                value={group.name ?? ''}
                                onChange={(e) => onChangeGroupData(e, group.id)}
                                error={touchedName && Boolean(errorName)}
                                helperText={touchedName && errorName}
                                sx={{
                                    marginRight: '6px',
                                    '& .MuiInputBase-root': {
                                        backgroundColor: darkMode ? '' : 'white',
                                    },
                                }}
                                fullWidth
                                onClick={(e) => e.stopPropagation()}
                                disabled={isDisabled}
                            />
                            <TextField
                                label={i18next.t('wizard.entityTemplate.groupDisplayName')}
                                id={displayName}
                                name={displayName}
                                value={group.displayName ?? ''}
                                onChange={(e) => onChangeGroupData(e, group.id)}
                                error={touchedTitle && Boolean(errorTitle)}
                                helperText={touchedTitle && errorTitle}
                                sx={{
                                    marginRight: '6px',
                                    '& .MuiInputBase-root': {
                                        backgroundColor: darkMode ? '' : 'white',
                                    },
                                }}
                                fullWidth
                                onClick={(e) => e.stopPropagation()}
                            />

                            <MeltaTooltip
                                title={i18next.t(`wizard.entityTemplate.${group.fields.length ? 'cantDeleteGroupWithFields' : 'deleteGroup'}`)}
                            >
                                <Grid>
                                    <IconButton
                                        component="span"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            remove(index);
                                        }}
                                        disabled={!!group.fields.length}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </MeltaTooltip>
                        </Grid>
                    </AccordionSummary>

                    <AccordionDetails
                        ref={(node) => {
                            drop(node as any);
                        }}
                    >
                        <Grid marginBottom={3}>
                            <Divider />
                        </Grid>

                        {group.fields?.map((field, idx) => (
                            <Field
                                field={field}
                                index={idx}
                                parentId={group.id}
                                onDrop={moveField}
                                buildProps={{ ...buildProps(field, idx, index) }}
                                key={field.id}
                                setFieldValue={setFieldDisplayValueWrapper(idx, index) as FieldEditCardProps['setFieldValue']}
                                setValues={setDisplayValueWrapper(idx, group.id)}
                                uniqueConstraints={uniqueConstraints}
                                setUniqueConstraints={setUniqueConstraints}
                                values={values}
                            />
                        ))}

                        <Grid
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                type="button"
                                variant="contained"
                                style={{
                                    marginTop: group.fields.length === 0 ? '30px' : '10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                                onClick={() => {
                                    if (group.id !== '') addFieldToGroup(group);
                                }}
                            >
                                <Typography>{addPropertyButtonLabel}</Typography>
                            </Button>
                        </Grid>
                        {(errors?.[propertiesType]?.[index] as any)?.fields === i18next.t('validation.oneField') && (
                            <div style={{ color: 'error' }}>{i18next.t('validation.oneField')}</div>
                        )}
                    </AccordionDetails>
                </FieldBlockAccordion>
            </Grid>
        </Grid>
    );
};
