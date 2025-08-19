import { Grid } from '@mui/material';
import React, { useRef } from 'react';
import Iframe from 'react-iframe';
import { IMongoIFrame } from '../../../interfaces/iFrames';
import { CardTitle } from './TableCard';

const IFrameCard: React.FC<{ metaData: IMongoIFrame }> = ({ metaData }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Grid ref={containerRef} sx={{ width: '100%', height: '100%', gap: 2 }} container direction="column">
            <Grid>
                <CardTitle title={metaData.name} />
            </Grid>

            <Grid size={{ xs: 12 }} style={{ overflow: 'hidden', flexGrow: 1 }}>
                <Iframe url={metaData.url} title={metaData.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};

export default IFrameCard;
