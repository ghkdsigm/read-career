import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScraperManager } from './scraper-manager.service';
import { JobKoreaScraper } from './scrapers/jobkorea-scraper.service';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [JobsModule],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperManager, JobKoreaScraper],
})
export class ScraperModule {}

