import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/core/decorators/public-route.decorator';
import { IFiltersWithPagination } from 'src/utils/interfaces/filters-pagination';
import { CreateShortUrlDto } from './dtos/create-short-url.dto';
import { UpdateOriginalUrlDto } from './dtos/update-original-url.dto';
import { IShortUrlResponse } from './interfaces/short-url-response';
import { LinkService } from './link.service';

@ApiTags('Links')
@ApiBearerAuth()
@Controller('links')
export class LinkController {
  constructor(
    private readonly linkService: LinkService,
  ) {}

  @ApiResponse({
    status: 201,
    description: 'The short URL has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'The request body is invalid or missing required fields.',
  })
  @Public()
  @Post()
  async create(
    @Body() body: CreateShortUrlDto,
    @Req() req: Request,
  ): Promise<IShortUrlResponse> {
    const userId = req.user ? req.user['sub'] : null;
    const link = await this.linkService.create({ originalUrl: body.originalUrl }, userId);
    return { shortUrl: this.linkService.formatShortUrl(link.code) };
  }

  @ApiResponse({
    status: 200,
    description: 'The list of short URLs with their access counts.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access. User must be logged in to view their links.',
  })
  @Get('user')
  async findAllByUser(
    @Req() req: Request,
    @Query() filters: IFiltersWithPagination,
  ): Promise<IShortUrlResponse[]> 
  {
    const userId = req.user ? req.user['sub'] : null;
    return await this.linkService.findAllByUser({
      pagination: {
        page: filters?.page || 1,
        perPage: filters?.perPage || 10,
      },
      userId: userId,
    });
  }

  @ApiResponse({
    status: 404,
    description: 'Link not found.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the original URL.',
  })
  @Public()
  @Get(':code')
  async redirectToOriginalUrl(
    @Param('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const { originalUrl } = await this.linkService.redirectToOriginalUrl(code);
    return res.redirect(302, originalUrl);
  }

  @ApiResponse({
    status: 201,
    description: 'The original URL has been successfully updated.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access. User must be logged in to view their links.',
  })
  @ApiResponse({
    status: 404,
    description: 'Link not found.',
  })
  @Patch('url/:id')
  async updateOriginalUrl(
    @Param('id') id: string,
    @Body() body: UpdateOriginalUrlDto,
  ): Promise<IShortUrlResponse> {
    return await this.linkService.updateOriginalUrl(id, body.originalUrl);
  }

  @ApiResponse({
    status: 404,
    description: 'Link not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'You do not have permission to delete this link.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access. User must be logged in to view their links.',
  })
  @Delete(':id')
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = req.user ? req.user['sub'] : null;
    await this.linkService.softDelete(id, userId);
  }

}
