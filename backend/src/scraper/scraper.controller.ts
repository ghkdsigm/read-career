import { Controller, Get, Post, Body } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScrapeRequestDto } from './dto/scrape-request.dto';

@Controller('api/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('scrape')
  async scrape(@Body() scrapeRequest: ScrapeRequestDto) {
    const results = await this.scraperService.scrape(
      scrapeRequest.site,
      scrapeRequest.keywords,
      scrapeRequest.max_pages,
    );
    return {
      success: true,
      count: results.length,
      saved_count: results.length,
      results,
    };
  }

  @Get('sites')
  getAvailableSites() {
    return {
      sites: this.scraperService.getAvailableSites(),
    };
  }
}

