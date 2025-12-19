import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../../application/services/user.service';
import { WardService } from '../../application/services/ward.service';
import { WardAccessPermissionService } from '../../application/services/ward-access-permission.service';
import { CreateWardDto } from '../dto/create-ward.dto';
import { UpdateWardDto } from '../dto/update-ward.dto';
import { LinkWardDto } from '../dto/link-ward.dto';
import { GrantAccessDto } from '../dto/grant-access.dto';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('users')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly wardService: WardService,
    private readonly accessPermissionService: WardAccessPermissionService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getMe(@Request() req: any) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  async updateMe(@Request() req: any, @Body() updateDto: any) {
    return this.userService.updateProfile(req.user.id, updateDto);
  }

  @Get('wards')
  @ApiOperation({ summary: 'Get all wards for current guardian' })
  @ApiResponse({ status: 200, description: 'Wards retrieved successfully' })
  async getWards(@Request() req: any) {
    return this.wardService.getWardsByGuardianId(req.user.id);
  }

  @Post('wards')
  @ApiOperation({ summary: 'Create new ward' })
  @ApiResponse({ status: 201, description: 'Ward created successfully' })
  async createWard(@Request() req: any, @Body() createWardDto: CreateWardDto) {
    return this.wardService.create(req.user.id, createWardDto);
  }

  @Get('wards/:wardId')
  @ApiOperation({ summary: 'Get ward by ID' })
  @ApiResponse({ status: 200, description: 'Ward retrieved successfully' })
  async getWard(@Request() req: any, @Param('wardId') wardId: string) {
    return this.wardService.getById(req.user.id, wardId);
  }

  @Put('wards/:wardId')
  @ApiOperation({ summary: 'Update ward' })
  @ApiResponse({ status: 200, description: 'Ward updated successfully' })
  async updateWard(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Body() updateWardDto: UpdateWardDto,
  ) {
    return this.wardService.update(req.user.id, wardId, updateWardDto);
  }

  @Delete('wards/:wardId')
  @ApiOperation({ summary: 'Delete ward' })
  @ApiResponse({ status: 200, description: 'Ward deleted successfully' })
  async deleteWard(@Request() req: any, @Param('wardId') wardId: string) {
    return this.wardService.delete(req.user.id, wardId);
  }

  @Post('wards/link')
  @ApiOperation({ summary: 'Link existing ward to guardian' })
  @ApiResponse({ status: 200, description: 'Ward linked successfully' })
  async linkWard(@Request() req: any, @Body() linkWardDto: LinkWardDto) {
    return this.wardService.linkWard(req.user.id, linkWardDto);
  }

  @Post('wards/:wardId/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `ward-${req.params.wardId}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Upload ward avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    // Get base URL from environment or use default
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;
    return this.wardService.updateAvatar(req.user.id, wardId, avatarUrl);
  }

  // Эндпоинты для управления правами доступа
  @Post('wards/:wardId/access')
  @ApiOperation({ summary: 'Grant access to ward for user' })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  async grantAccess(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Body() grantAccessDto: GrantAccessDto,
  ) {
    return this.accessPermissionService.grantAccess(
      req.user.id,
      wardId,
      grantAccessDto.userId,
      grantAccessDto,
    );
  }

  @Get('wards/:wardId/access')
  @ApiOperation({ summary: 'Get list of users with access to ward' })
  @ApiResponse({ status: 200, description: 'Access list retrieved successfully' })
  async getAccessList(@Request() req: any, @Param('wardId') wardId: string) {
    return this.accessPermissionService.getWardAccessList(wardId, req.user.id);
  }

  @Put('wards/:wardId/access/:permissionId')
  @ApiOperation({ summary: 'Update access permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  async updatePermission(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Param('permissionId') permissionId: string,
    @Body() updates: Partial<NonNullable<GrantAccessDto['permissions']>>,
  ) {
    return this.accessPermissionService.updatePermission(req.user.id, permissionId, updates);
  }

  @Delete('wards/:wardId/access/:permissionId')
  @ApiOperation({ summary: 'Revoke access to ward' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  async revokeAccess(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.accessPermissionService.revokeAccess(req.user.id, permissionId);
  }

  @Get('wards/:wardId/access/history')
  @ApiOperation({ summary: 'Get access history (audit log)' })
  @ApiResponse({ status: 200, description: 'Access history retrieved successfully' })
  async getAccessHistory(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('severity') severity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.accessPermissionService.getAccessHistory(wardId, req.user.id, {
      userId,
      actionType,
      severity: severity as any,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }
}

