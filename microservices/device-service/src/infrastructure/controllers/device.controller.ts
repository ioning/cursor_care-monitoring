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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceService } from '../application/services/device.service';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { UpdateDeviceDto } from '../dto/update-device.dto';
import { LinkDeviceDto } from '../dto/link-device.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('devices')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new device' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  async register(@Request() req, @Body() registerDeviceDto: RegisterDeviceDto) {
    return this.deviceService.register(req.user.id, registerDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for current user' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  async getDevices(@Request() req, @Query('wardId') wardId?: string) {
    return this.deviceService.getDevices(req.user.id, wardId);
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiResponse({ status: 200, description: 'Device retrieved successfully' })
  async getDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.deviceService.getDevice(req.user.id, deviceId);
  }

  @Put(':deviceId')
  @ApiOperation({ summary: 'Update device' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  async updateDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.updateDevice(req.user.id, deviceId, updateDeviceDto);
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete device' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.deviceService.deleteDevice(req.user.id, deviceId);
  }

  @Post(':deviceId/link')
  @ApiOperation({ summary: 'Link device to ward' })
  @ApiResponse({ status: 200, description: 'Device linked successfully' })
  async linkDevice(
    @Request() req,
    @Param('deviceId') deviceId: string,
    @Body() linkDeviceDto: LinkDeviceDto,
  ) {
    return this.deviceService.linkDevice(req.user.id, deviceId, linkDeviceDto);
  }

  @Post(':deviceId/unlink')
  @ApiOperation({ summary: 'Unlink device from ward' })
  @ApiResponse({ status: 200, description: 'Device unlinked successfully' })
  async unlinkDevice(@Request() req, @Param('deviceId') deviceId: string) {
    return this.deviceService.unlinkDevice(req.user.id, deviceId);
  }
}

