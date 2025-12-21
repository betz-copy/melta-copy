import { CircularProgress, Grid } from '@mui/material';
import { IMongoIframe } from '@packages/iframe';
import React from 'react';
import Iframe from 'react-iframe';
import { useQuery } from 'react-query';
import { useLocation, useParams } from 'wouter';
import { getIFrameById } from '../../services/iFramesService';
import IFrameHeadline from './Headline';

interface IFramePageProps {
    iFrame?: IMongoIframe;
    setIFramesOrder?: (value: string[]) => void;
    isIFramePage?: boolean;
    setIFrameDeleted?: React.Dispatch<React.SetStateAction<boolean>>;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame, setIFramesOrder, isIFramePage = true, setIFrameDeleted }) => {
    const { iFrameId } = useParams<{ iFrameId: string }>();
    const id = iFrame?._id || iFrameId;
    const [_, navigate] = useLocation();

    const { data: iFrameData, isLoading } = useQuery(['getIFrame', id], async () => getIFrameById(id!), {
        initialData: iFrame,
        retry: false,
        onError: (_err) => {
            if (iFrameId) navigate('/404');
        },
    });

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return (
        <Grid container width="100%" height="100%" flexDirection="column" flexWrap="nowrap">
            <Grid>
                <IFrameHeadline
                    iFrame={iFrame ?? iFrameData!}
                    setIFramesOrder={setIFramesOrder}
                    isIFramePage={isIFramePage}
                    setIFrameDeleted={setIFrameDeleted}
                />
            </Grid>
            <Grid
                style={{
                    height: 'calc(100vh - 48px)',
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};
export default IFramePage;
