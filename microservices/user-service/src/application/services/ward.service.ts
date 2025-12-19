import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WardRepository } from '../../infrastructure/repositories/ward.repository';
import { GuardianWardRepository } from '../../infrastructure/repositories/guardian-ward.repository';
import { CreateWardDto } from '../../infrastructure/dto/create-ward.dto';
import { UpdateWardDto } from '../../infrastructure/dto/update-ward.dto';
import { LinkWardDto } from '../../infrastructure/dto/link-ward.dto';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class WardService {
  private readonly logger = createLogger({ serviceName: 'user-service' });

  constructor(
    private readonly wardRepository: WardRepository,
    private readonly guardianWardRepository: GuardianWardRepository,
  ) {}

  async getWardsByGuardianId(guardianId: string) {
    const wards = await this.guardianWardRepository.findWardsByGuardianId(guardianId);
    return {
      success: true,
      data: wards,
    };
  }

  async create(guardianId: string, createWardDto: CreateWardDto) {
    const wardId = randomUUID();
    const ward = await this.wardRepository.create({
      id: wardId,
      ...createWardDto,
    });

    // Link ward to guardian
    await this.guardianWardRepository.create({
      guardianId,
      wardId,
      relationship: createWardDto.relationship || 'ward',
    });

    this.logger.info(`Ward created: ${wardId} by guardian ${guardianId}`, { wardId, guardianId });

    return {
      success: true,
      data: ward,
      message: 'Ward created successfully',
    };
  }

  async getById(guardianId: string, wardId: string) {
    // Verify guardian has access to this ward
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.findById(wardId);
    if (!ward) {
      throw new NotFoundException('Ward not found');
    }

    return {
      success: true,
      data: ward,
    };
  }

  async update(guardianId: string, wardId: string, updateWardDto: UpdateWardDto) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.update(wardId, {
      ...updateWardDto,
      dateOfBirth: updateWardDto.dateOfBirth ? new Date(updateWardDto.dateOfBirth) : undefined,
    });

    this.logger.info(`Ward updated: ${wardId} by guardian ${guardianId}`, { wardId, guardianId });

    return {
      success: true,
      data: ward,
      message: 'Ward updated successfully',
    };
  }

  async delete(guardianId: string, wardId: string) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    await this.wardRepository.delete(wardId);
    await this.guardianWardRepository.deleteByWardId(wardId);

    this.logger.info(`Ward deleted: ${wardId} by guardian ${guardianId}`, { wardId, guardianId });

    return {
      success: true,
      message: 'Ward deleted successfully',
    };
  }

  async linkWard(guardianId: string, linkWardDto: LinkWardDto) {
    // Verify ward exists
    const ward = await this.wardRepository.findById(linkWardDto.wardId);
    if (!ward) {
      throw new NotFoundException('Ward not found');
    }

    // Check if already linked
    const existing = await this.guardianWardRepository.findByGuardianAndWard(
      guardianId,
      linkWardDto.wardId,
    );
    if (existing) {
      throw new ForbiddenException('Ward is already linked to this guardian');
    }

    await this.guardianWardRepository.create({
      guardianId,
      wardId: linkWardDto.wardId,
      relationship: linkWardDto.relationship || 'ward',
    });

    this.logger.info(`Ward linked: ${linkWardDto.wardId} to guardian ${guardianId}`, {
      wardId: linkWardDto.wardId,
      guardianId,
    });

    return {
      success: true,
      message: 'Ward linked successfully',
    };
  }

  async updateAvatar(guardianId: string, wardId: string, avatarUrl: string) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.update(wardId, { avatarUrl });

    this.logger.info(`Ward avatar updated: ${wardId} by guardian ${guardianId}`, {
      wardId,
      guardianId,
    });

    return {
      success: true,
      data: ward,
      message: 'Avatar updated successfully',
    };
  }
}


