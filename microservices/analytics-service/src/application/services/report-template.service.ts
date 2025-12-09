import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReportTemplateRepository, CreateReportTemplateDto } from '../../infrastructure/repositories/report-template.repository';
import { createLogger } from '../../../../shared/libs/logger';

@Injectable()
export class ReportTemplateService {
  private readonly logger = createLogger({ serviceName: 'report-template-service' });

  constructor(private readonly templateRepository: ReportTemplateRepository) {}

  async createTemplate(userId: string, createDto: CreateReportTemplateDto) {
    const template = await this.templateRepository.create({
      ...createDto,
      createdBy: userId,
    });

    this.logger.info(`Report template created: ${template.id} by user ${userId}`);
    return {
      success: true,
      data: template,
    };
  }

  async getTemplateById(templateId: string, userId: string) {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Проверяем доступ (глобальные, публичные или созданные пользователем)
    if (!template.isGlobal && !template.isPublic && template.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return {
      success: true,
      data: template,
    };
  }

  async getUserTemplates(userId: string) {
    const templates = await this.templateRepository.findByUserId(userId);
    return {
      success: true,
      data: templates,
    };
  }

  async getGlobalTemplates() {
    const templates = await this.templateRepository.findGlobalTemplates();
    return {
      success: true,
      data: templates,
    };
  }

  async getPublicTemplates() {
    const templates = await this.templateRepository.findPublicTemplates();
    return {
      success: true,
      data: templates,
    };
  }

  async getTemplatesForWard(wardId: string) {
    const templates = await this.templateRepository.findByWardId(wardId);
    return {
      success: true,
      data: templates,
    };
  }

  async updateTemplate(templateId: string, userId: string, updates: Partial<CreateReportTemplateDto>) {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    const updated = await this.templateRepository.update(templateId, updates as any);
    return {
      success: true,
      data: updated,
    };
  }

  async deleteTemplate(templateId: string, userId: string) {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.templateRepository.delete(templateId);
    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  async incrementUsage(templateId: string) {
    await this.templateRepository.incrementUsageCount(templateId);
  }
}


