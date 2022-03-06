import { CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { Graph } from '../../common/graph';
import { getInstancesRequest, getRelatedInstancesByIdRequest } from '../../services/instancesService';

const sizeByConnectons = (id: number, arr: { source: number; target: number }[]) => {
    let counter = 0;
    arr.forEach((curr) => {
        if (curr.target === id || curr.source === id) {
            counter++;
        }
    });

    if (counter > 6) {
        return 6;
    }

    if (counter > 3) {
        return 4;
    }

    return 2;
};

const Home = () => {
    const { instanceId } = useParams();
    const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

    const { isLoading, isFetching } = useQuery(
        ['getGraphInstances', instanceId],
        () => (instanceId ? getRelatedInstancesByIdRequest(instanceId) : getInstancesRequest()),
        {
            refetchOnWindowFocus: false,
            onSuccess: (entitiesData) => {
                setData({
                    nodes: entitiesData.nodes.map((item) => {
                        return {
                            data: { ...item },
                            id: item.id,
                            val: sizeByConnectons(item.id, entitiesData.links),
                        };
                    }),
                    links: entitiesData.links,
                });
            },
        },
    );

    if (isLoading || isFetching) {
        return (
            <div style={{ textAlign: 'center', marginTop: '35vh' }}>
                <CircularProgress size={80} />
            </div>
        );
    }

    return <Graph data={data} centerOn={Number(instanceId)} />;
};

export default Home;
