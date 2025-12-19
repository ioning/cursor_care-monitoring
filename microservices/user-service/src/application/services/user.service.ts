import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class UserService {
  private readonly logger = createLogger({ serviceName: 'user-service' });

  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async updateProfile(userId: string, updateDto: any) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.userRepository.update(userId, updateDto);

    this.logger.info(`User profile updated: ${userId}`, { userId, updates: Object.keys(updateDto) });

    return {
      success: true,
      data: updated,
      message: 'Profile updated successfully',
    };
  }
}

