import { Grid } from '@mui/material';
import React, { useRef } from 'react';
import Iframe from 'react-iframe';
import { IFrame } from '../../interfaces/iFrames';
import { CardTitle } from './tableView';

const IframeView: React.FC<{ metaData: IFrame }> = ({ metaData }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Grid ref={containerRef} sx={{ width: '100%', height: '100%', gap: 2 }} container direction="column">
            <Grid item>
                <CardTitle title={metaData.name} />
            </Grid>

            <Grid item xs style={{ overflow: 'hidden', flexGrow: 1 }}>
                <Iframe url={metaData.url} title={metaData.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};

export { IframeView };
