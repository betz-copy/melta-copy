import { ValidateRequest, wrapController } from '@microservices/shared';
import { Router } from 'express';
import WorkspacesController from './controller';
import {
    createOneSchema,
    deleteOneSchema,
    getByIdSchema,
    getDirSchema,
    getFileSchema,
    getWorkspaceHierarchyIdsSchema,
    getWorkspaceIds,
    searchWorkspacesSchema,
    updateMetadataSchema,
    updateOneSchema,
} from './validator.schema';

const workspacesRouter: Router = Router();

workspacesRouter.post('/ids', ValidateRequest(getWorkspaceIds), wrapController(WorkspacesController.getWorkspaceIds));

workspacesRouter.post('/dir', ValidateRequest(getDirSchema), wrapController(WorkspacesController.getDir));

workspacesRouter.post('/file', ValidateRequest(getFileSchema), wrapController(WorkspacesController.getFile));

workspacesRouter.get(
    '/:id/ids/hierarchy',
    ValidateRequest(getWorkspaceHierarchyIdsSchema),
    wrapController(WorkspacesController.getWorkspaceHierarchyIds),
);

workspacesRouter.get('/:id', ValidateRequest(getByIdSchema), wrapController(WorkspacesController.getById));

workspacesRouter.post('/', ValidateRequest(createOneSchema), wrapController(WorkspacesController.createOne));

workspacesRouter.delete('/:id', ValidateRequest(deleteOneSchema), wrapController(WorkspacesController.deleteOne));

workspacesRouter.put('/:id', ValidateRequest(updateOneSchema), wrapController(WorkspacesController.updateOne));

workspacesRouter.patch('/:id/metadata', ValidateRequest(updateMetadataSchema), wrapController(WorkspacesController.updateMetadata));

workspacesRouter.post('/search', ValidateRequest(searchWorkspacesSchema), wrapController(WorkspacesController.getWorkspaces));

export default workspacesRouter;
