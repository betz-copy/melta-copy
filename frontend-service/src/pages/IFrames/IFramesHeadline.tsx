import React from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { TopBarGrid } from '../../common/TopBar';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { useLocalStorage } from '../../utils/useLocalStorage';

const IFramesPageHeadline: React.FC<{
    onSearch: (value: string) => void;
    setIFrameWizardDialogState?: () => void;
}> = ({ onSearch, setIFrameWizardDialogState }) => {
    const theme = useTheme();

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    // const [iFramesToShowCheckbox, setIFramesToShowCheckbox] = useLocalStorage<string[]>('iFramesToShow', iFrames);

    // // const iFramesToShowCheckbox = iFramesIdsToShowCheckbox
    // //     .map((id) => entityTemplates.get(id))
    // //     .filter((template): template is IMongoEntityTemplatePopulated => !!template);

    // const setTemplatesToShowCheckbox = (newTemplates: React.SetStateAction<IMongoEntityTemplatePopulated[]>) => {
    //     setTemplateIdsToShowCheckbox((prevtemplateIdsToShowCheckbox) => {
    //         const prevTemplates = prevtemplateIdsToShowCheckbox
    //             .map((id) => entityTemplates.get(id))
    //             .filter((template): template is IMongoEntityTemplatePopulated => !!template);
    //         const updatedTemplates = typeof newTemplates === 'function' ? newTemplates(prevTemplates) : newTemplates;
    //         return updatedTemplates.map((template) => template._id);
    //     });
    // };
    return (
        <TopBarGrid sx={{ height: '3.6rem' }} dir="rtl" container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid container spacing={5} wrap="nowrap" alignItems="center">
                <Grid item>
                    <BlueTitle
                        title={i18next.t('pages.iFrames')}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                    />
                </Grid>
                <Grid item>
                    <Grid container wrap="nowrap" gap="15px">
                        <GlobalSearchBar onSearch={onSearch} borderRadius="7px" placeholder={i18next.t('globalSearch.searchInPage')} toTopBar />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                {myPermissions.templatesManagementId && (
                    <IconButton onClick={setIFrameWizardDialogState}>
                        <AddIcon htmlColor="primary" />
                        {/* <Typography fontSize={14} style={{ fontWeight: '500' }}>
                            {i18next.t('wizard.iFrame.addIFrame')}
                        </Typography> */}
                    </IconButton>
                )}
            </Grid>
        </TopBarGrid>
    );
};

export default IFramesPageHeadline;
