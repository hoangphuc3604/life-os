import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { Request } from 'express';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(HeaderAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search notes' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  search(
    @Req() req: Request,
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.searchService.search(
      (req as any).user.userId,
      query,
      limit ? parseInt(String(limit)) : 20,
      offset ? parseInt(String(offset)) : 0,
    );
  }
}
