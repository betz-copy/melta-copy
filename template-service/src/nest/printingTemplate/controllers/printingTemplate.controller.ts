import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePrintingTemplateDto, UpdatePrintingTemplateDto } from '../dto/printingTemplate.dto';
import { PrintingTemplateService } from '../services/printingTemplate.service';
import {
    ApiCreatePrintingTemplate,
    ApiDeletePrintingTemplate,
    ApiGetAllPrintingTemplates,
    ApiGetPrintingTemplateById,
    ApiUpdatePrintingTemplate,
} from './printingTemplate.swagger';

@Controller('api/templates/printing-templates')
@ApiTags('Printing Templates')
export class PrintingTemplateController {
    constructor(private readonly printingTemplateService: PrintingTemplateService) {}

    @Get()
    @ApiGetAllPrintingTemplates()
    async getAllPrintingTemplates() {
        return this.printingTemplateService.getAllPrintingTemplates();
    }

    @Get(':id')
    @ApiGetPrintingTemplateById()
    async getPrintingTemplateById(@Param('id') id: string) {
        return this.printingTemplateService.getPrintingTemplateById(id);
    }

    @Post()
    @ApiCreatePrintingTemplate()
    async createPrintingTemplate(@Body() createDto: CreatePrintingTemplateDto) {
        return this.printingTemplateService.createPrintingTemplate(createDto);
    }

    @Put(':id')
    @ApiUpdatePrintingTemplate()
    async updatePrintingTemplate(@Param('id') id: string, @Body() updateDto: UpdatePrintingTemplateDto) {
        return this.printingTemplateService.updatePrintingTemplate(id, updateDto);
    }

    @Delete(':id')
    @ApiDeletePrintingTemplate()
    async deletePrintingTemplate(@Param('id') id: string) {
        return this.printingTemplateService.deletePrintingTemplate(id);
    }
}
