import { CircularProgress } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Tree from '../../../../common/Tree';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { ITreeNode } from '../../../../interfaces/printingTemplates';
import { getRelationshipSelectTreeForPrint } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';
import { INestedRelationshipTemplates } from '../..';

export type EntityConnectionsProps = {
    connectionsTemplates: INestedRelationshipTemplates[];
    setConnectionsTemplates: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
    setConnectionsInstances: Dispatch<SetStateAction<IConnection[]>>;
    selectedConnections: INestedRelationshipTemplates[];
    setSelectedConnections: Dispatch<SetStateAction<INestedRelationshipTemplates[]>>;
};

const RelationshipSelection: React.FC<{
    expandedEntity: IEntityExpanded;
    setSelectedRelationShipIds: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ expandedEntity, setSelectedRelationShipIds }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const currentUser = useUserStore((state) => state.user);

    const allowedEntityTemplates = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);

    const templateIds = [...entityTemplates.keys()];

    const { data: relationShips, isLoading } = useQuery<ITreeNode[]>({
        queryKey: ['getRelationshipSelectTreeForPrint', expandedEntity.entity.properties._id, { templateIds }],
        queryFn: () =>
            getRelationshipSelectTreeForPrint(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: 4 } }, // TODO: put in config
                { templateIds: allowedEntityTemplatesIds },
            ),
    });
    if (isLoading) return <CircularProgress size={20} />;

    return relationShips ? (
        <Tree
            treeItems={relationShips}
            getItemId={({ neoRelIds }) => neoRelIds.join(',')}
            getItemLabel={({ sourceEntity, destinationEntity, displayName }) =>
                `${displayName} (${sourceEntity.displayName} > ${destinationEntity.displayName})`
            }
            removeDivider
            onSelectItems={(itemIds) => setSelectedRelationShipIds([...new Set((itemIds as string[]).flatMap((id) => id.split(',')))])}
            selectionPropagation={{ descendants: true, parents: false }}
            // TODO: selects like eve wants
        />
    ) : (
        <></>
    );
};

export default RelationshipSelection;
