import React, { useEffect } from 'react';
import { Grid } from '@mui/material';

import i18next from 'i18next';
import { CategoriesRow } from './components/CategoriesRow';
import { EntityTemplatesRow } from './components/EntityTemplatesRow';
import { RelationshipTemplatesRow } from './components/RelationshipTemplatesRow';

import '../../css/pages.css';

const SystemManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.systemManagement')), [setTitle]);

    return (
        <Grid container className="pageMargin" spacing={4}>
            <CategoriesRow />
            <EntityTemplatesRow />
            <RelationshipTemplatesRow />
        </Grid>
    );
};

export default SystemManagement;
