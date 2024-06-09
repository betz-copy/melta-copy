import { Autocomplete, TextField, IconButton } from '@mui/material';
import i18next from 'i18next';
import React from 'react';

const UniqueGroupComponent = ({ uniqueConstraints, uniqueGroupName, handleUniqueGroupNameChange, deleteUniqueGroup, createNewUniqueGroup }) => (
    <Autocomplete
        fullWidth
        freeSolo
        disableClearable
        options={Array.isArray(uniqueConstraints) ? uniqueConstraints.filter((group) => group.groupName !== '')?.map((group) => group.groupName) : []}
        value={uniqueGroupName}
        onChange={(_event, newValue) => handleUniqueGroupNameChange(newValue)}
        renderInput={(params) => (
            <div style={{ position: 'relative' }}>
                <TextField
                    {...params}
                    label={i18next.t('wizard.entityTemplate.createOrAddUniqueGroup')}
                    error={touchedName && Boolean(errorName)}
                    helperText={touchedName && errorName}
                    sx={{ marginRight: '5px' }}
                    fullWidth
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {params.InputProps.endAdornment}
                                {uniqueGroupName &&
                                    Array.isArray(uniqueConstraints) &&
                                    uniqueConstraints?.some((group) => group.groupName === uniqueGroupName) && (
                                        <IconButton aria-label="delete" onClick={() => deleteUniqueGroup(uniqueGroupName)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                            </>
                        ),
                    }}
                />

                {params.inputProps.value &&
                    Array.isArray(uniqueConstraints) &&
                    !uniqueConstraints?.some((group) => group.groupName === params.inputProps.value) && (
                        <IconButton
                            aria-label="create"
                            onClick={() => {
                                createNewUniqueGroup(params.inputProps.value);
                            }}
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    )}
            </div>
        )}
    />
);
