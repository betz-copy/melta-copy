import joi from 'joi';

// GET /api/units/hierarchy/
export const getHierarchyByWorkspaceId = joi.object({
    query: {},
    body: {},
    params: {
        workspaceId: joi.string().required(),
    },
});
