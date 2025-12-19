import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportTemplateService } from '../../application/services/report-template.service';
import { CreateReportTemplateDto } from '../../infrastructure/repositories/report-template.repository';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('report-templates')
@Controller('report-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportTemplateController {
  constructor(private readonly templateService: ReportTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create report template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Request() req: any, @Body() createDto: CreateReportTemplateDto) {
    return this.templateService.createTemplate(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getUserTemplates(@Request() req: any) {
    return this.templateService.getUserTemplates(req.user.id);
  }

  @Get('global')
  @ApiOperation({ summary: 'Get global templates' })
  @ApiResponse({ status: 200, description: 'Global templates retrieved successfully' })
  async getGlobalTemplates() {
    return this.templateService.getGlobalTemplates();
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public templates' })
  @ApiResponse({ status: 200, description: 'Public templates retrieved successfully' })
  async getPublicTemplates() {
    return this.templateService.getPublicTemplates();
  }

  @Get('ward/:wardId')
  @ApiOperation({ summary: 'Get templates for ward' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplatesForWard(@Param('wardId') wardId: string) {
    return this.templateService.getTemplatesForWard(wardId);
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplateById(@Request() req: any, @Param('templateId') templateId: string) {
    return this.templateService.getTemplateById(templateId, req.user.id);
  }

  @Put(':templateId')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Request() req: any,
    @Param('templateId') templateId: string,
    @Body() updates: Partial<CreateReportTemplateDto>,
  ) {
    return this.templateService.updateTemplate(templateId, req.user.id, updates);
  }

  @Delete(':templateId')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Request() req: any, @Param('templateId') templateId: string) {
    return this.templateService.deleteTemplate(templateId, req.user.id);
  }
}


