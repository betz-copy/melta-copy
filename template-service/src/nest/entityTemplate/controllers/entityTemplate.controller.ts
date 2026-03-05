import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import {
    CreateEntityTemplateDto,
    SearchEntityTemplateDto,
    SearchByFormatDto,
    UpdateEntityTemplateDto,
    UpdateStatusDto,
    UpdateActionDto,
} from '../dto/entityTemplate.dto';
import { EntityTemplate } from '../schemas/entityTemplate.schema';
import { EntityTemplateService } from '../services/entityTemplate.service';
import {
    ApiSearchTemplates,
    ApiSearchByFormat,
    ApiGetTemplateById,
    ApiGetAllTemplates,
    ApiGetTemplatesByCategory,
    ApiCreateTemplate,
    ApiUpdateTemplate,
    ApiUpdateStatus,
    ApiUpdateAction,
    ApiDeleteTemplate,
} from './entityTemplate.swagger';

@ApiTags('Entity Templates')
@ApiExtraModels(EntityTemplate)
@Controller('api/templates/entities')
export class EntityTemplateController {
    constructor(private readonly service: EntityTemplateService) {}

    @Post('search')
    @ApiSearchTemplates()
    async searchTemplates(@Body() query: SearchEntityTemplateDto) {
        return this.service.searchTemplates(query);
    }

    @Post('searchByFormat')
    @ApiSearchByFormat()
    async searchByFormat(@Body() query: SearchByFormatDto) {
        return this.service.getTemplatesByFormat(query.format);
    }

    @Get('all')
    @ApiGetAllTemplates()
    async getAllTemplates() {
        return this.service.getAllTemplates();
    }

    @Get('category/:categoryId')
    @ApiGetTemplatesByCategory()
    async getTemplatesByCategory(@Param('categoryId') categoryId: string) {
        return this.service.getTemplatesByCategory(categoryId);
    }

    @Get('related/:relatedTemplateId')
    @ApiGetTemplatesByCategory()
    async getTemplatesUsingRelationshipReference(@Param('relatedTemplateId') relatedTemplateId: string) {
        return this.service.getTemplatesUsingRelationshipReference(relatedTemplateId);
    }

    @Get(':templateId')
    @ApiGetTemplateById()
    async getTemplateById(@Param('templateId') templateId: string) {
        return this.service.getTemplateById(templateId);
    }

    @Post()
    @ApiCreateTemplate()
    async createTemplate(@Body() createDto: CreateEntityTemplateDto) {
        return this.service.createTemplate(createDto);
    }

    @Put(':templateId')
    @ApiUpdateTemplate()
    async updateTemplate(@Param('templateId') templateId: string, @Body() updateDto: UpdateEntityTemplateDto) {
        return this.service.updateTemplate(templateId, updateDto);
    }

    @Put(':templateId/status')
    @ApiUpdateStatus()
    async updateStatus(@Param('templateId') templateId: string, @Body() updateDto: UpdateStatusDto) {
        return this.service.updateTemplateStatus(templateId, updateDto.disabled);
    }

    @Put(':templateId/actions')
    @ApiUpdateAction()
    async updateAction(@Param('templateId') templateId: string, @Body() updateDto: UpdateActionDto) {
        return this.service.updateTemplateAction(templateId, updateDto.actions || '');
    }

    @Delete(':templateId')
    @ApiDeleteTemplate()
    async deleteTemplate(@Param('templateId') templateId: string) {
        return this.service.deleteTemplate(templateId);
    }
}
