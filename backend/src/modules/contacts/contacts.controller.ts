import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@Controller('accounts/:accountId/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(
    @Param('accountId') accountId: string,
    @Query() query: QueryContactsDto,
  ) {
    return this.contactsService.findAll(accountId, query);
  }

  @Get(':id')
  findOne(@Param('accountId') accountId: string, @Param('id') id: string) {
    return this.contactsService.findOne(accountId, id);
  }

  @Post()
  create(
    @Param('accountId') accountId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(accountId, dto);
  }

  @Patch(':id')
  update(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(accountId, id, dto);
  }
}
