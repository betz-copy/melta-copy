import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRuleDto, UpdateRuleDto } from '../dto/rule.dto';
import { RuleService } from '../services/rule.service';
import { ApiCreateRule, ApiDeleteRule, ApiGetAllRules, ApiGetRuleById, ApiGetRulesByEntity, ApiUpdateRule } from './rule.swagger';

@Controller('api/templates/rules')
@ApiTags('Rules')
export class RuleController {
    constructor(private readonly ruleService: RuleService) {}

    @Get()
    @ApiGetAllRules()
    async getAllRules() {
        return this.ruleService.getAllRules();
    }

    @Get(':id')
    @ApiGetRuleById()
    async getRuleById(@Param('id') id: string) {
        return this.ruleService.getRuleById(id);
    }

    @Get('entity/:entityTemplateId')
    @ApiGetRulesByEntity()
    async getRulesByEntity(@Param('entityTemplateId') entityTemplateId: string) {
        return this.ruleService.getRulesByEntityTemplate(entityTemplateId);
    }

    @Post()
    @ApiCreateRule()
    async createRule(@Body() createDto: CreateRuleDto) {
        return this.ruleService.createRule(createDto);
    }

    @Put(':id')
    @ApiUpdateRule()
    async updateRule(@Param('id') id: string, @Body() updateDto: UpdateRuleDto) {
        return this.ruleService.updateRule(id, updateDto);
    }

    @Delete(':id')
    @ApiDeleteRule()
    async deleteRule(@Param('id') id: string) {
        return this.ruleService.deleteRule(id);
    }
}
