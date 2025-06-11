import { Card, Grid } from '@mui/material';
import Iframe from 'react-iframe';
import React from 'react';
import { BlueTitle } from '../../../common/BlueTitle';
import { StepComponentProps } from '../../../common/wizards';
import { IFrame as IframeType } from '../../../interfaces/iFrames';
import { useWorkspaceStore } from '../../../stores/workspace';

const BodyComponent: React.FC<StepComponentProps<IframeType>> = ({ values: { name, url }, errors, touched }) => {
    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    return (
        <Grid item container width="100%" height="100%" alignItems="center" justifyContent="center">
            {name && url && touched.url && !errors.url && (
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

export { BodyComponent };
