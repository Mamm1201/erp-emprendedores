import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthUser } from '../auth/auth.service';
import { AccreditationsService } from './accreditations.service';
import { IssueAccreditationDto } from './dto/issue-accreditation.dto';
import { ReissueAccreditationDto } from './dto/reissue-accreditation.dto';
import { RevokeAccreditationDto } from './dto/revoke-accreditation.dto';

@Controller('persons/:personId/accreditations')
@Roles(UserRole.ADMIN)
export class AccreditationsController {
  constructor(private readonly accreditationsService: AccreditationsService) {}

  @Get()
  findByPerson(@Param('personId') personId: string) {
    return this.accreditationsService.findByPerson(personId);
  }

  @Post()
  issue(
    @Param('personId') personId: string,
    @Body() dto: IssueAccreditationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.accreditationsService.issue(personId, dto, user.id);
  }

  @Patch(':id/revoke')
  revoke(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @Body() dto: RevokeAccreditationDto,
  ) {
    return this.accreditationsService.revoke(personId, id, dto);
  }

  @Post('reissue')
  reissue(
    @Param('personId') personId: string,
    @Body() dto: ReissueAccreditationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.accreditationsService.reissue(personId, dto, user.id);
  }
}
