import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateAssignmentDto,
  CreateClientDto,
  CreateEmployeeDto,
  CreateShiftDto,
  CreateSupervisorDto,
  CreateWorkLocationDto,
  UpdateAssignmentDto,
  UpdateClientDto,
  UpdateEmployeeDto,
  UpdateShiftDto,
  UpdateSupervisorDto,
  UpdateWorkLocationDto,
} from './dto/master-data.dto';
import { MasterDataService } from './master-data.service';

@ApiTags('Master Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('clients')
  listClients() {
    return this.masterDataService.listClients();
  }

  @Post('clients')
  @Roles(RoleName.ADMIN)
  createClient(@Body() dto: CreateClientDto) {
    return this.masterDataService.createClient(dto);
  }

  @Patch('clients/:id')
  @Roles(RoleName.ADMIN)
  updateClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.masterDataService.updateClient(id, dto);
  }

  @Delete('clients/:id')
  @Roles(RoleName.ADMIN)
  deleteClient(@Param('id') id: string) {
    return this.masterDataService.deleteClient(id);
  }

  @Get('work-locations')
  listWorkLocations(@Query('clientId') clientId?: string) {
    return this.masterDataService.listWorkLocations(clientId);
  }

  @Post('work-locations')
  @Roles(RoleName.ADMIN)
  createWorkLocation(@Body() dto: CreateWorkLocationDto) {
    return this.masterDataService.createWorkLocation(dto);
  }

  @Patch('work-locations/:id')
  @Roles(RoleName.ADMIN)
  updateWorkLocation(
    @Param('id') id: string,
    @Body() dto: UpdateWorkLocationDto,
  ) {
    return this.masterDataService.updateWorkLocation(id, dto);
  }

  @Delete('work-locations/:id')
  @Roles(RoleName.ADMIN)
  deleteWorkLocation(@Param('id') id: string) {
    return this.masterDataService.deleteWorkLocation(id);
  }

  @Get('shifts')
  listShifts() {
    return this.masterDataService.listShifts();
  }

  @Post('shifts')
  @Roles(RoleName.ADMIN)
  createShift(@Body() dto: CreateShiftDto) {
    return this.masterDataService.createShift(dto);
  }

  @Patch('shifts/:id')
  @Roles(RoleName.ADMIN)
  updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.masterDataService.updateShift(id, dto);
  }

  @Delete('shifts/:id')
  @Roles(RoleName.ADMIN)
  deleteShift(@Param('id') id: string) {
    return this.masterDataService.deleteShift(id);
  }

  @Get('supervisors')
  listSupervisors() {
    return this.masterDataService.listSupervisors();
  }

  @Post('supervisors')
  @Roles(RoleName.ADMIN)
  createSupervisor(@Body() dto: CreateSupervisorDto) {
    return this.masterDataService.createSupervisor(dto);
  }

  @Patch('supervisors/:id')
  @Roles(RoleName.ADMIN)
  updateSupervisor(@Param('id') id: string, @Body() dto: UpdateSupervisorDto) {
    return this.masterDataService.updateSupervisor(id, dto);
  }

  @Delete('supervisors/:id')
  @Roles(RoleName.ADMIN)
  deleteSupervisor(@Param('id') id: string) {
    return this.masterDataService.deleteSupervisor(id);
  }

  @Get('employees')
  listEmployees() {
    return this.masterDataService.listEmployees();
  }

  @Post('employees')
  @Roles(RoleName.ADMIN)
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.masterDataService.createEmployee(dto);
  }

  @Patch('employees/:id')
  @Roles(RoleName.ADMIN)
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.masterDataService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  @Roles(RoleName.ADMIN)
  deleteEmployee(@Param('id') id: string) {
    return this.masterDataService.deleteEmployee(id);
  }

  @Get('assignments')
  listAssignments(@Query('employeeId') employeeId?: string) {
    return this.masterDataService.listAssignments(employeeId);
  }

  @Post('assignments')
  @Roles(RoleName.ADMIN)
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.masterDataService.createAssignment(dto);
  }

  @Patch('assignments/:id')
  @Roles(RoleName.ADMIN)
  updateAssignment(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) {
    return this.masterDataService.updateAssignment(id, dto);
  }

  @Delete('assignments/:id')
  @Roles(RoleName.ADMIN)
  deleteAssignment(@Param('id') id: string) {
    return this.masterDataService.deleteAssignment(id);
  }
}
