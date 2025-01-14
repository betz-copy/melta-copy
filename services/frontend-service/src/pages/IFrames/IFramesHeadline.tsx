import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { DropResult } from 'react-beautiful-dnd';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import AddIcon from '@mui/icons-material/Add';
import { IMongoIFrame } from '@microservices/shared-interfaces';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { LocalStorage } from '../../utils/localStorage';
import { SelectCheckbox } from '../../common/SelectCheckBox';
import { useUserStore } from '../../stores/user';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';

const { iFramesOrderKey } = environment.iFrames;

const IFramesPageHeadline: React.FC<{
    onSearch: (value: string) => void;
    setIFrameWizardDialogState?: () => void;
    iFramesOrder: string[];
    setIFramesOrder: (value: string[]) => void;
}> = ({ onSearch, setIFrameWizardDialogState, iFramesOrder, setIFramesOrder }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [allIFramesAllowed, setAllIFramesAllowed] = useState<IMongoIFrame[]>();
    const [inputValue, setInputValue] = useState('');
    const currentUser = useUserStore((state) => state.user);

    useEffect(() => {
        setAllIFramesAllowed(queryClient.getQueryData('allIFrames')!);
    }, [iFramesOrder]);

    const resetIFramesDimensions = () => {
        iFramesOrder?.forEach((iFrameId: string) => {
            localStorage.removeItem(`iFrameDimension_${iFrameId}`);
        });
        LocalStorage.remove(iFramesOrderKey);
        window.location.reload();
    };

    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const updatedItems: string[] = [...iFramesOrder];

        const [reorderedItem] = updatedItems.splice(result.source.index, 1);
        updatedItems.splice(result.destination.index, 0, reorderedItem);

        LocalStorage.set(iFramesOrderKey, updatedItems);
        setIFramesOrder(updatedItems);

        queryClient.setQueryData<IMongoIFrame[]>('allIFrames', (oldData) => {
            if (!oldData) return [];
            return updatedItems.map((id) => oldData.find((iFrame: IMongoIFrame) => iFrame._id === id)) as IMongoIFrame[];
        });
    };
    return (
        <TopBarGrid sx={{ height: '3.6rem' }} dir="rtl" container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid container spacing={3} wrap="nowrap" alignItems="center">
                <Grid item>
                    <BlueTitle
                        title={i18next.t('pages.iFrames')}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                    />
                </Grid>
                <Grid item>
                    <SelectCheckbox<IMongoIFrame>
                        title={i18next.t('iFrames.arrangementIFrames')}
                        filterIcon
                        options={allIFramesAllowed ?? []}
                        selectedOptions={[]}
                        setSelectedOptions={() => {}}
                        getOptionId={(option) => option._id}
                        getOptionLabel={({ name }) => name}
                        toTopBar
                        onDragEnd={handleOnDragEnd}
                        isSelectDisabled
                        showIcon
                    />
                </Grid>

                <Grid item>
                    <Grid container wrap="nowrap" gap="15px">
                        <GlobalSearchBar
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            onSearch={() => {
                                onSearch(inputValue);
                            }}
                            borderRadius="7px"
                            placeholder={i18next.t('globalSearch.searchInPage')}
                            toTopBar
                        />
                    </Grid>
                </Grid>
                <Grid item>
                    <MeltaTooltip title={i18next.t('iFrames.filterDrags')}>
                        <IconButton onClick={resetIFramesDimensions} sx={{ borderRadius: 10, height: '35px', width: '35px' }}>
                            <FilterAltOffIcon sx={{ fontSize: '26px' }} />
                        </IconButton>
                    </MeltaTooltip>
                </Grid>
            </Grid>

            <Grid container justifyContent="flex-end" alignItems="center">
                <Grid item>
                    {currentUser.currentWorkspacePermissions.admin && (
                        <IconButtonWithPopover
                            popoverText={i18next.t('iFrames.addIFrame')}
                            iconButtonProps={{
                                onClick: setIFrameWizardDialogState,
                            }}
                            style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '150px', height: '35px' }}
                        >
                            <AddIcon htmlColor="white" />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                                {i18next.t('iFrames.addIFrame')}
                            </Typography>
                        </IconButtonWithPopover>
                    )}
                </Grid>
            </Grid>
        </TopBarGrid>
    );
};

export default IFramesPageHeadline;
