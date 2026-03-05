import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { CreateRelationshipTemplateDto, SearchRelationshipDto, UpdateRelationshipTemplateDto } from '../dto/relationshipTemplate.dto';
import { RelationshipTemplate } from '../schemas/relationshipTemplate.schema';
import { RelationshipTemplateService } from '../services/relationshipTemplate.service';
import {
    ApiSearchRelationships,
    ApiGetAllRelationships,
    ApiGetRelationshipById,
    ApiCreateRelationship,
    ApiUpdateRelationship,
    ApiDeleteRelationship,
} from './relationshipTemplate.swagger';

@ApiTags('Relationship Templates')
@ApiExtraModels(RelationshipTemplate)
@Controller('api/templates/relationships')
export class RelationshipTemplateController {
    constructor(private readonly service: RelationshipTemplateService) {}

    @Post('search')
    @ApiSearchRelationships()
    async searchRelationships(@Body() query: SearchRelationshipDto) {
        return this.service.searchRelationships(query);
    }

    @Get('all')
    @ApiGetAllRelationships()
    async getAllRelationships() {
        return this.service.getAllRelationships();
    }

    @Get(':relationshipId')
    @ApiGetRelationshipById()
    async getRelationshipById(@Param('relationshipId') relationshipId: string) {
        return this.service.getRelationshipById(relationshipId);
    }

    @Post()
    @ApiCreateRelationship()
    async createRelationship(@Body() createDto: CreateRelationshipTemplateDto) {
        return this.service.createRelationship(createDto);
    }

    @Put(':relationshipId')
    @ApiUpdateRelationship()
    async updateRelationship(@Param('relationshipId') relationshipId: string, @Body() updateDto: UpdateRelationshipTemplateDto) {
        return this.service.updateRelationship(relationshipId, updateDto);
    }

    @Delete(':relationshipId')
    @ApiDeleteRelationship()
    async deleteRelationship(@Param('relationshipId') relationshipId: string) {
        return this.service.deleteRelationship(relationshipId);
    }
}
