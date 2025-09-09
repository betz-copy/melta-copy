import { Card, Grid } from '@mui/material';
import React from 'react';
import Iframe from 'react-iframe';
import BlueTitle from '../../../../common/MeltaDesigns/BlueTitle';
import { StepComponentProps } from '../../../../common/wizards';
import { IFrameWizardValues } from '../../../../common/wizards/iFrame';
import { useWorkspaceStore } from '../../../../stores/workspace';

const BodyComponent: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values: { name, url }, errors }) => {
    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    return (
        <Grid container width="100%" height="100%" alignItems="center" justifyContent="center">
            {name && url && !errors.url && (
                <Card
                    sx={{
                        width: '90%',
                        height: '90%',
                        borderRadius: '7px',
                        border: '1px #CCCFE5',
                        gap: 2,
                    }}
                >
                    <BlueTitle
                        title={name}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: headlineTitleFontSize, justifySelf: 'center', padding: '20px' }}
                    />
                    <Grid
                        style={{
                            height: '93%',
                            width: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <Iframe url={url} title={name} width="100%" height="100%" frameBorder={0} />
                    </Grid>
                </Card>
            )}
        </Grid>
    );
};

export default BodyComponent;
