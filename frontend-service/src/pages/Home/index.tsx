import { CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { Graph } from '../../common/graph';
import { getAllEntitiesRequest, getRelatedEntitiesByIdRequest } from '../../services/entitiesService';

const sizeByConnectons = (id: string, arr: { source: string; target: string }[]) => {
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
    const { entityId } = useParams();
    const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

    const { isLoading, isFetching } = useQuery(
        ['getGraphEntities', entityId],
        () => (entityId ? getRelatedEntitiesByIdRequest(entityId) : getAllEntitiesRequest()),
        {
            onSuccess: (entitiesData) => {
                setData({
                    nodes: entitiesData.nodes.map((item) => {
                        return {
                            data: { ...item },
                            id: item._id,
                            val: sizeByConnectons(item._id, entitiesData.links),
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

    return <Graph data={data} centerOn={Number(entityId)} />;
};

export default Home;
