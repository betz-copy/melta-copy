import React, { useState } from 'react';
import { RichTreeView } from '@mui/x-tree-view';
import { v4 as uuid } from 'uuid';
import { IEntityTemplatePopulatedWithChildren } from '../interfaces/entityTemplates';

interface TemplatesTreeProps {
    templatesWithChildren: [IEntityTemplatePopulatedWithChildren];
    onClickItem: (path: string) => void;
}

const TemplatesTree: React.FC<TemplatesTreeProps> = ({ templatesWithChildren, onClickItem }) => {
    return (
        <RichTreeView
            onItemSelectionToggle={(_event: React.SyntheticEvent, nodeId: string, isSelected) => onClickItem(isSelected ? nodeId : '/')}
            checkboxSelection
            multiSelect={false}
            items={templatesWithChildren}
            getItemId={(item) => (item?.path ? `${item.path}${item?.displayName}` : uuid())}
            getItemLabel={(item) => item?.displayName ?? ''}
        />
    );
};
export default TemplatesTree;
