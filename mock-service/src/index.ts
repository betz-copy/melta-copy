/* eslint-disable no-console */

import { AxiosError } from 'axios';
import { Chance } from 'chance';
import { JSONSchemaFaker } from 'json-schema-faker';
import config from './config';
import { createGantts } from './gantts';
import { createInstances, createRelationshipInstances, isInstanceServiceAlive, updateConstraintsOfTemplate } from './instances';
import categories from './mocks/categories';
import entityTemplates from './mocks/entityTemplates';
import getProcessTemplateToCreate from './mocks/processTemplates';
import relationshipTemplates from './mocks/relationshipTemplates';
import simbaCategories from './mocks/simba/categories';
import { carChildTemplate, crashChildTemplate, driverChildTemplate } from './mocks/simba/childTemplates';
import { carEntityTemplate, crashEntityTemplate, driverEntityTemplate } from './mocks/simba/entityTemplates';
import getUsersToCreate from './mocks/users';
import getWorkspacesToCreate from './mocks/workspaces';
import { createProcessInstances } from './processInstances';
import { createProcessTemplates, isProcessServiceAlive } from './processTemplate';
import { isStorageServiceAlive, uploadFile } from './storageService';
import { createCharts } from './templateCharts';
import { isTemplateServiceAlive } from './templates';
import { createCategories } from './templates/categories';
import { createChildTemplate } from './templates/childTemplates';
import { createCategoryOrder } from './templates/config';
import { createEntityTemplates } from './templates/entityTemplates';
import { createRelationshipTemplates, getRelationshipTemplateById } from './templates/relationshipTemplates';
import { createRules } from './templates/rules';
import { createUsers, isUserServiceAlive } from './users';
import { createWorkspaces, getRootWorkspace, getWorkspaces, isWorkpacesServiceAlive, updateWorkspaceMetadata } from './workspaces';

const main = async () => {
    console.log(`Mock started ${JSON.stringify(config, null, 4)}`);

    const { err: workspacesServiceAliveErr } = await isWorkpacesServiceAlive();
    if (workspacesServiceAliveErr) {
        console.log('Workspace Service is not alive');
        throw workspacesServiceAliveErr;
    }

    const [rootWorkspace, workspaces] = await Promise.all([getRootWorkspace(), getWorkspaces()]);

    if (workspaces.length) {
        console.log('DB not empty');
        return;
    }

    const { err: templateServiceAliveErr } = await isTemplateServiceAlive();
    if (templateServiceAliveErr) {
        console.log('Template Service is not alive');
        throw templateServiceAliveErr;
    }

    const { err: processServiceAliveErr } = await isProcessServiceAlive();
    if (processServiceAliveErr) {
        console.log('Process Service is not alive');
        throw processServiceAliveErr;
    }

    const { err: userServiceAliveErr } = await isUserServiceAlive();
    if (userServiceAliveErr) {
        console.log('User Service is not alive');
        throw userServiceAliveErr;
    }

    const { err: instanceServiceAliveErr } = await isInstanceServiceAlive();
    if (instanceServiceAliveErr) {
        console.log('Instance Service is not alive');
        throw instanceServiceAliveErr;
    }

    const { err: storageServiceAliveErr } = await isStorageServiceAlive();
    if (storageServiceAliveErr) {
        console.log('Storage Service is not alive');
        throw storageServiceAliveErr;
    }

    console.log('All services alive!');

    const seed = config.seed ?? Math.floor(Math.random() * 1000);
    console.log(`Picked seed ${seed}`);

    const chance = new Chance(seed);
    JSONSchemaFaker.option({ random: () => chance.floating({ min: 0, max: 0.9999, fixed: 4 }) });

    console.log('Creating workspaces');

    const mainWorkspaces = await createWorkspaces(getWorkspacesToCreate());

    const mainWorkspace = mainWorkspaces.find(({ name }) => name === 'operational')!;

    await createCategoryOrder(mainWorkspace._id, []);

    console.log('Creating categories');

    const createdCategories = await createCategories(mainWorkspace._id, categories);

    console.log('Creating entity templates');

    const createdEntityTemplates = await createEntityTemplates(mainWorkspace._id, entityTemplates, createdCategories);

    console.log('Creating relationshipTemplates templates');

    const createdRelationshipTemplates = await createRelationshipTemplates(mainWorkspace._id, relationshipTemplates, createdEntityTemplates);

    console.log('Creating users');

    const users = await createUsers(getUsersToCreate(rootWorkspace._id, mainWorkspace._id, createdCategories));
    const userIds = users.map(({ _id }) => _id);

    console.log('Creating example file');

    const exampleFileId = await uploadFile(mainWorkspace._id);

    console.log('Creating entities');

    const createdEntityInstances = await createInstances(mainWorkspace._id, userIds[0], createdEntityTemplates, chance, exampleFileId);

    console.log('Creating relationships');

    await createRelationshipInstances(mainWorkspace._id, userIds[0], createdEntityInstances, createdRelationshipTemplates, chance);

    console.log('Creating rules');

    await createRules(mainWorkspace._id, createdEntityTemplates, createdRelationshipTemplates);

    console.log('Creating process templates');

    const createdProcessTemplates = await createProcessTemplates(mainWorkspace._id, getProcessTemplateToCreate(userIds, chance));

    console.log('Creating process Instances');

    await createProcessInstances(mainWorkspace._id, createdProcessTemplates, userIds, chance, exampleFileId);

    console.log('Creating gantts');

    await createGantts(chance, mainWorkspace._id, createdEntityTemplates, createdRelationshipTemplates);

    console.log('Creating charts');

    await createCharts(mainWorkspace._id, createdEntityTemplates, userIds[0]);

    console.log('Finished');

    console.log('\n\nCreating simba workspaces');

    const simbaWorkspace = mainWorkspaces.find(({ name }) => name === 'test')!;

    console.log('Creating simba categories');

    const createdSimbaCategories = await createCategories(simbaWorkspace._id, simbaCategories);

    console.log('Creating simba entity templates');

    const createdSimbaDriverTemplate = (await createEntityTemplates(simbaWorkspace._id, [driverEntityTemplate], createdSimbaCategories))[0];
    await updateConstraintsOfTemplate(simbaWorkspace._id, createdSimbaDriverTemplate._id, {
        requiredConstraints: ['full_name'],
        uniqueConstraints: [],
    });
    carEntityTemplate.properties.properties.parents.relationshipReference!.relatedTemplateId = createdSimbaDriverTemplate._id;
    const createdSimbaCarTemplate = (await createEntityTemplates(simbaWorkspace._id, [carEntityTemplate], createdSimbaCategories))[0];
    await updateConstraintsOfTemplate(simbaWorkspace._id, createdSimbaCarTemplate._id, {
        requiredConstraints: ['ID'],
        uniqueConstraints: [],
    });

    crashEntityTemplate.properties.properties.driver.relationshipReference!.relatedTemplateId = createdSimbaDriverTemplate._id;
    crashEntityTemplate.properties.properties.car.relationshipReference!.relatedTemplateId = createdSimbaCarTemplate._id;
    const createdSimbaCrashTemplate = (await createEntityTemplates(simbaWorkspace._id, [crashEntityTemplate], createdSimbaCategories))[0];

    console.log('createdSimbaCrashTemplate', createdSimbaCrashTemplate);

    console.log('Creating simba entity child templates');

    const createdSimbaDriverChildTemplate = await createChildTemplate(simbaWorkspace._id, driverChildTemplate, createdSimbaDriverTemplate);
    await createChildTemplate(simbaWorkspace._id, carChildTemplate, createdSimbaCarTemplate);
    const createdSimbaCrashChildTemplate = await createChildTemplate(simbaWorkspace._id, crashChildTemplate, createdSimbaCrashTemplate);

    console.log('createdSimbaCrashChildTemplate', createdSimbaCrashChildTemplate);

    console.log('Creating simba relationship templates');

    const createdSimbaCarTemplateRelationshipTemplateId =
        createdSimbaCarTemplate.properties.properties.parents.relationshipReference!.relationshipTemplateId!;

    await getRelationshipTemplateById(simbaWorkspace._id, createdSimbaCarTemplateRelationshipTemplateId);

    const simbaWorkspaceMetadata = {
        clientSide: {
            usersInfoChildTemplateId: createdSimbaDriverChildTemplate._id,
            numOfPropsToShow: 9,
            clientSideWorkspaceName: 'simba' as const,
            fullNameField: 'full_name',
        },
    };

    console.log('Updating simba workspace metadata');

    await updateWorkspaceMetadata(simbaWorkspace._id, simbaWorkspaceMetadata);

    try {
        console.log('Creating simba drivers entities');
        const createdSimbaDriverInstances = await createInstances(
            simbaWorkspace._id,
            userIds[0],
            [createdSimbaDriverTemplate],
            chance,
            exampleFileId,
            1,
        );
        console.log('Creating simba cars entities');

        JSONSchemaFaker.format('relationshipReference', (_value) => createdSimbaDriverInstances[0].createdEntity.properties._id);

        await createInstances(
            simbaWorkspace._id,
            userIds[0],
            [createdSimbaCarTemplate],
            chance,
            exampleFileId,
            10,
            createdSimbaDriverInstances[0].createdEntity.properties._id,
        );

        console.log('Creating simba crashes entities');

        await createInstances(simbaWorkspace._id, userIds[0], [createdSimbaCrashTemplate], chance, exampleFileId, 10);
    } catch (error) {
        console.log('error creating simba driver/car instances', (error as AxiosError).response?.data);
    }

    console.log('Finished simba');
};

main();
