import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateChildTemplateDto, UpdateChildTemplateDto } from '../dto/childTemplate.dto';
import { ChildTemplateService } from '../services/childTemplate.service';
import {
    ApiCreateChildTemplate,
    ApiDeleteChildTemplate,
    ApiGetAllChildTemplates,
    ApiGetChildTemplateById,
    ApiGetChildTemplatesByParent,
    ApiUpdateChildTemplate,
} from './childTemplate.swagger';

@Controller('api/templates/child-templates')
@ApiTags('Child Templates')
export class ChildTemplateController {
    constructor(private readonly childTemplateService: ChildTemplateService) {}

    @Get()
    @ApiGetAllChildTemplates()
    async getAllChildTemplates() {
        return this.childTemplateService.getAllChildTemplates();
    }

    @Get(':id')
    @ApiGetChildTemplateById()
    async getChildTemplateById(@Param('id') id: string) {
        return this.childTemplateService.getChildTemplateById(id);
    }

    @Get('parent/:parentTemplateId')
    @ApiGetChildTemplatesByParent()
    async getChildTemplatesByParent(@Param('parentTemplateId') parentTemplateId: string) {
        return this.childTemplateService.getChildTemplatesByParent(parentTemplateId);
    }

    @Post()
    @ApiCreateChildTemplate()
    async createChildTemplate(@Body() createDto: CreateChildTemplateDto) {
        return this.childTemplateService.createChildTemplate(createDto);
    }

    @Put(':id')
    @ApiUpdateChildTemplate()
    async updateChildTemplate(@Param('id') id: string, @Body() updateDto: UpdateChildTemplateDto) {
        return this.childTemplateService.updateChildTemplate(id, updateDto);
    }

    @Delete(':id')
    @ApiDeleteChildTemplate()
    async deleteChildTemplate(@Param('id') id: string) {
        return this.childTemplateService.deleteChildTemplate(id);
    }
}
