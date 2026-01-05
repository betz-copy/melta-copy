import { useMatomo } from '@datapunt/matomo-tracker-react';
import { RestartAltOutlined as ResetIcon } from '@mui/icons-material';
import { Grid, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IChildTemplateMap } from '@packages/child-template';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { CopyUrlButton } from '../../common/CopyUrlButton';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../stores/darkMode';

interface GraphTopBarProps {
    onReset: React.MouseEventHandler<HTMLButtonElement>;
    set3DView: (is3DView: boolean) => void;
    is3DView: boolean;
    filteredEntityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setFilteredEntityTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    templateId?: string;
    childTemplateId?: string;
}

const GraphTopBar: React.FC<GraphTopBarProps> = ({ onReset, set3DView, is3DView, templateId, childTemplateId }) => {
    const queryClient = useQueryClient();

    const theme = useTheme();
    const { trackEvent } = useMatomo();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const entityTemplate = childTemplateId ? childTemplates.get(childTemplateId) : templateId ? entityTemplates.get(templateId) : undefined;

    return (
        <Grid
            container
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2.5rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                    style={{
                        color: theme.palette.primary.main,
                        fontWeight: '800',
                    }}
                    component="h4"
                    variant="h4"
                >
                    {entityTemplate?.category.displayName}
                </Typography>
                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>
                <Typography style={{ paddingBottom: '2px' }} variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                    {entityTemplate?.displayName}
                </Typography>
            </Grid>

            <Grid>
                <Grid container alignItems="center" spacing={0.8} wrap="nowrap">
                    <Grid>
                        <ToggleButtonGroup value={is3DView ? '3D' : '2D'} size="small" sx={{ height: '2rem', marginX: '0.2rem' }}>
                            <ToggleButton
                                value="3D"
                                onClick={() => {
                                    set3DView(true);

                                    trackEvent({
                                        category: '3D-mode',
                                        action: 'click',
                                    });
                                }}
                                sx={{ borderRadius: 4 }}
                            >
                                <Typography color="primary" fontWeight="bold">
                                    3D
                                </Typography>
                            </ToggleButton>
                            <ToggleButton value="2D" onClick={() => set3DView(false)} sx={{ borderRadius: 4 }}>
                                <Typography color="primary" fontWeight="bold">
                                    2D
                                </Typography>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid>
                        <CopyUrlButton style={{ color: theme.palette.primary.main }} />
                    </Grid>

                    <Grid>
                        <IconButtonWithPopover popoverText={i18next.t('graph.reset')} iconButtonProps={{ onClick: onReset }}>
                            <ResetIcon color="primary" />
                        </IconButtonWithPopover>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { GraphTopBar };
