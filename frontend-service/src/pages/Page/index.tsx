import React, { useState } from 'react';
import { Card, CardContent, CardActions, Button, Typography } from '@mui/material';
import { EntityTemplateWizard } from '../../common/wizards/entityTemplate';
import { CategoryWizard } from '../../common/wizards/category';
import { RelationshipTemplateWizard } from '../../common/wizards/relationshipTemplate';

const Page = () => {
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isRelTemplateOpen, setIsRelTemplateOpen] = useState(false);

    const closeTemplate = () => {
        setIsTemplateOpen(false);
    };

    const closeCategory = () => {
        setIsCategoryOpen(false);
    };

    const closeRel = () => {
        setIsRelTemplateOpen(false);
    };

    return (
        <>
            <Card>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        entity template
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={() => setIsTemplateOpen(true)}>
                        open
                    </Button>
                    <EntityTemplateWizard open={isTemplateOpen} handleClose={closeTemplate} />
                </CardActions>
            </Card>
            <Card>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        category
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={() => setIsCategoryOpen(true)}>
                        open
                    </Button>
                    <CategoryWizard open={isCategoryOpen} handleClose={closeCategory} />
                </CardActions>
            </Card>
            <Card>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        relationship template
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={() => setIsRelTemplateOpen(true)}>
                        open
                    </Button>
                    <RelationshipTemplateWizard open={isRelTemplateOpen} handleClose={closeRel} />
                </CardActions>
            </Card>
        </>
    );
};

export { Page };
