import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, Checkbox, FormControlLabel, DialogActions, IconButton } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { SelectCheckbox } from '../../../../common/SelectCheckbox';
import { IMongoRelationshipTemplatePopulated } from '../../../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../../../interfaces/categories';

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    relevantRelationshipTemplates: IMongoRelationshipTemplatePopulated[];
    selected: IMongoRelationshipTemplatePopulated[];
    setSelected: React.Dispatch<React.SetStateAction<IMongoRelationshipTemplatePopulated[]>>;
    categoriesWithRelationshipTemplates: (IMongoCategory & {
        relationshipTemplates: IMongoRelationshipTemplatePopulated[];
    })[];
    options: {
        showDate: boolean;
        setShowDate: React.Dispatch<React.SetStateAction<boolean>>;
        showDisabled: boolean;
        setShowDisabled: React.Dispatch<React.SetStateAction<boolean>>;
        showEntityDates: boolean;
        setShowEntityDates: React.Dispatch<React.SetStateAction<boolean>>;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ open, handleClose, relevantRelationshipTemplates, selected, setSelected, categoriesWithRelationshipTemplates, onClick, options }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle paddingLeft="4px">
                <Grid container display="flex" justifyContent="space-between">
                    <Grid item> {i18next.t('entityPage.print.printOptions')}</Grid>
                    <Grid item>
                        <IconButton onClick={handleClose}>
                            <CloseOutlined />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent style={{ width: '500px', height: '240px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid item>
                        <SelectCheckbox
                            title={i18next.t('entityPage.print.chooseRelationship')}
                            options={relevantRelationshipTemplates}
                            selectedOptions={selected}
                            setSelectedOptions={setSelected}
                            getOptionId={({ _id }) => _id}
                            getOptionLabel={({
                                displayName,
                                sourceEntity: { displayName: sourceEntityDisplayName },
                                destinationEntity: { displayName: destinationEntityDisplayName },
                            }) => {
                                return `${displayName} (${sourceEntityDisplayName} > ${destinationEntityDisplayName})`;
                            }}
                            groupsProps={{
                                useGroups: true,
                                groups: categoriesWithRelationshipTemplates,
                                getGroupId: ({ _id }) => _id,
                                getGroupLabel: ({ displayName }) => displayName,
                                getGroupOfOption: (option, groups) =>
                                    groups.find((group) =>
                                        group.relationshipTemplates.find((relationshipTemplate) => relationshipTemplate._id === option._id),
                                    )!,
                            }}
                        />
                    </Grid>
                    <Grid paddingTop="25px">
                        <Grid>
                            <FormControlLabel
                                control={<Checkbox checked={options.showDate} onChange={() => options.setShowDate((cur) => !cur)} />}
                                label={i18next.t('entityPage.print.showDate')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                control={<Checkbox checked={options.showDisabled} onChange={() => options.setShowDisabled((cur) => !cur)} />}
                                label={i18next.t('entityPage.print.showDisabled')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                control={<Checkbox checked={options.showEntityDates} onChange={() => options.setShowEntityDates((cur) => !cur)} />}
                                label={i18next.t('entityPage.print.showEntityDates')}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions style={{ paddingLeft: '24px' }}>
                <Button
                    onClick={(ev) => {
                        handleClose();
                        onClick(ev);
                    }}
                    endIcon={<PrintOutlined />}
                >
                    {i18next.t('entityPage.print.continue')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { PrintOptionsDialog };
