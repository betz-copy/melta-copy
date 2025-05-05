import React from 'react';
import { TopBarGrid } from '../../../common/TopBar';

const DashboardItem: React.FC<{ title: string }> = ({ title }) => {
    return (
        <TopBarGrid
            container
            alignItems="center"
            wrap="nowrap"
            sx={{ marginBottom: 0, paddingRight: '1.6rem', boxShadow: '  -2px 2px 6px 0px #1E277533' }}
        >
            <Grid>
                <BlueTitle
                    title="הוספת טבלה"
                    component="h4"
                    variant="h4"
                    style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, whiteSpace: 'nowrap' }}
                />
            </Grid>
        </TopBarGrid>
    );
};

export { DashboardItem };
