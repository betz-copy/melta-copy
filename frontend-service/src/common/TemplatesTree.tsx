import React, { useState } from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { IEntityTemplatePopulatedWithChildren } from '../interfaces/entityTemplates';

interface TemplatesTreeProps {
    templatesWithchildren: IEntityTemplatePopulatedWithChildren;
    onClickItem: (path: string) => void;
}

const TemplatesTree: React.FC<TemplatesTreeProps> = ({ templatesWithchildren, onClickItem }) => {
    const [expanded, setExpanded] = useState<string[]>([]);

    const handleToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (_event: React.SyntheticEvent, nodeId: string) => {
        onClickItem(nodeId);
    };

    const renderItemPath = (path: string, displayName: string) => {
        return `${path}${path.endsWith('/') ? '' : '/'}${displayName}`;
    };

    const renderTree = (template: IEntityTemplatePopulatedWithChildren, nodeId: string): React.ReactNode => {
        return (
            <TreeItem key={nodeId} itemId={renderItemPath(template.path!, template.displayName)} label={template.displayName}>
                {template.children?.map((child) => renderTree(child, renderItemPath(template.path!, template.displayName)))}
            </TreeItem>
        );
    };

    return (
        <SimpleTreeView
            aria-label="rich tree view"
            defaultExpandedItems={expanded}
            onExpandedItemsChange={handleToggle}
            onItemClick={handleSelect}
            multiSelect={false}
        >
            {renderTree(templatesWithchildren, '/')}
        </SimpleTreeView>
    );
};
export default TemplatesTree;
