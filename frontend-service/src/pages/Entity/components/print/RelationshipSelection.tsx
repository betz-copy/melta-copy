import { CircularProgress } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Tree from '../../../../common/Tree';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { ITreeNode } from '../../../../interfaces/printingTemplates';
import { getTreeForPrintById } from '../../../../services/entitiesService';
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

const NewRelationShipSelection: React.FC<{
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
        queryKey: ['getExpandedEntityPrint', expandedEntity.entity.properties._id, { templateIds }],
        queryFn: () =>
            getTreeForPrintById(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: 4 } }, // TODO: put in config
                { disabled: false, templateIds: allowedEntityTemplatesIds, isOnlyTemplateIds: true },
            ),
    });
    if (isLoading) return <CircularProgress size={20} />;

    return relationShips ? (
        <Tree
            treeItems={relationShips}
            getItemId={({ mongoAndRelId, depth, sourceEntityId, destinationEntityId }) =>
                `${mongoAndRelId}&${depth}&${sourceEntityId}&${destinationEntityId}`
            }
            getItemLabel={({ sourceEntity, destinationEntity, displayName }) =>
                `${displayName} (${sourceEntity.displayName} > ${destinationEntity.displayName})`
            }
            removeDivider
            onSelectItems={(itemIds) => {
                setSelectedRelationShipIds(itemIds as string[]);
            }}
            // TODO: selects like eve wants
        />
    ) : (
        <></>
    );
};

export default NewRelationShipSelection;
