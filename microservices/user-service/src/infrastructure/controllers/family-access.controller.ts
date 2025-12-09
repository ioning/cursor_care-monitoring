import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FamilyAccessService, AddFamilyMemberDto, UpdateDutyScheduleDto } from '../../application/services/family-access.service';
import { CreateFamilyChatMessageDto } from '../../infrastructure/repositories/family-chat.repository';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('family-access')
@Controller('family')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FamilyAccessController {
  constructor(private readonly familyAccessService: FamilyAccessService) {}

  @Post('wards/:wardId/members')
  @ApiOperation({ summary: 'Add family member as guardian' })
  @ApiResponse({ status: 201, description: 'Family member added successfully' })
  async addFamilyMember(
    @Request() req,
    @Param('wardId') wardId: string,
    @Body() addMemberDto: AddFamilyMemberDto,
  ) {
    return this.familyAccessService.addFamilyMember(req.user.id, wardId, addMemberDto);
  }

  @Get('wards/:wardId/members')
  @ApiOperation({ summary: 'Get all guardians for ward' })
  @ApiResponse({ status: 200, description: 'Family members retrieved successfully' })
  async getFamilyMembers(@Request() req, @Param('wardId') wardId: string) {
    return this.familyAccessService.getFamilyMembers(wardId, req.user.id);
  }

  @Put('wards/:wardId/members/:guardianId/duty-schedule')
  @ApiOperation({ summary: 'Update duty schedule for guardian' })
  @ApiResponse({ status: 200, description: 'Duty schedule updated successfully' })
  async updateDutySchedule(
    @Request() req,
    @Param('wardId') wardId: string,
    @Param('guardianId') guardianId: string,
    @Body() updateDto: UpdateDutyScheduleDto,
  ) {
    return this.familyAccessService.updateDutySchedule(req.user.id, wardId, {
      ...updateDto,
      guardianId,
    });
  }

  @Post('wards/:wardId/transfer-primary')
  @ApiOperation({ summary: 'Temporarily transfer primary guardian rights' })
  @ApiResponse({ status: 200, description: 'Primary guardian transferred successfully' })
  async transferPrimaryGuardian(
    @Request() req,
    @Param('wardId') wardId: string,
    @Body() body: { newPrimaryId: string; startDate: string; endDate: string },
  ) {
    return this.familyAccessService.transferPrimaryGuardianTemporarily(
      req.user.id,
      wardId,
      body.newPrimaryId,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Post('wards/:wardId/chat')
  @ApiOperation({ summary: 'Create message in family chat' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  async createChatMessage(
    @Request() req,
    @Param('wardId') wardId: string,
    @Body() messageDto: CreateFamilyChatMessageDto,
  ) {
    return this.familyAccessService.createChatMessage(req.user.id, wardId, messageDto);
  }

  @Get('wards/:wardId/chat')
  @ApiOperation({ summary: 'Get family chat messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getChatMessages(
    @Request() req,
    @Param('wardId') wardId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.familyAccessService.getChatMessages(
      wardId,
      req.user.id,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Put('chat/:messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markMessageAsRead(@Request() req, @Param('messageId') messageId: string) {
    return this.familyAccessService.markMessageAsRead(messageId, req.user.id);
  }

  @Get('wards/:wardId/chat/unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req, @Param('wardId') wardId: string) {
    return this.familyAccessService.getUnreadCount(wardId, req.user.id);
  }
}


