import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { Grid, IconButton } from '@mui/material';
import { DropResult } from 'react-beautiful-dnd';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { LocalStorage } from '../../utils/localStorage';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { SelectCheckbox } from '../../common/SelectCheckbox';
import { useUserStore } from '../../stores/user';
import { MeltaTooltip } from '../../common/MeltaTooltip';

const { iFramesOrderKey } = environment.iFrames;
const IFramesPageHeadline: React.FC<{
    onSearch: (value: string) => void;
    setIFrameWizardDialogState?: () => void;
    iFramesOrder: string[];
    setIFramesOrder: (value: string[]) => void;
}> = ({ onSearch, setIFrameWizardDialogState, iFramesOrder, setIFramesOrder }) => {
    const queryClient = useQueryClient();
    const [allIFramesAllowed, setAllIFramesAllowed] = useState<IMongoIFrame[]>();
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

        queryClient.setQueryData('allIFrames', (oldData: any) => {
            return updatedItems.map((id) => oldData.find((iFrame: IMongoIFrame) => iFrame._id === id));
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
                    <SelectCheckbox
                        title={i18next.t('iFrames.arrangementIFrames')}
                        img={<img src="/icons/select-checkbox.svg" />}
                        options={allIFramesAllowed ?? []}
                        selectedOptions={[]}
                        setSelectedOptions={() => {}}
                        getOptionId={({ _id }) => _id}
                        getOptionLabel={({ name }) => name}
                        toTopBar
                        onDragEnd={handleOnDragEnd}
                        isSelectDisabled
                    />
                </Grid>

                <Grid item>
                    <Grid container wrap="nowrap" gap="15px">
                        <GlobalSearchBar onSearch={onSearch} borderRadius="7px" placeholder={i18next.t('globalSearch.searchInPage')} toTopBar />
                    </Grid>
                </Grid>
            </Grid>

            <Grid container justifyContent="flex-end" alignItems="center">
                <Grid item>
                    <MeltaTooltip title={i18next.t('iFrames.filterDrags')}>
                        <IconButton onClick={resetIFramesDimensions} sx={{ borderRadius: 10, height: '35px', width: '35px' }}>
                            <FilterAltOffIcon sx={{ fontSize: '26px' }} />
                        </IconButton>
                    </MeltaTooltip>
                </Grid>
                <Grid item>
                    {currentUser.currentWorkspacePermissions.admin && (
                        <MeltaTooltip title={i18next.t('iFrames.addIFrame')}>
                            <IconButton onClick={setIFrameWizardDialogState}>
                                <AddCircleIcon color="primary" sx={{ fontSize: '30px' }} />
                            </IconButton>
                        </MeltaTooltip>
                    )}
                </Grid>
            </Grid>
        </TopBarGrid>
    );
};

export default IFramesPageHeadline;
