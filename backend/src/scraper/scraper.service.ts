import { Injectable } from '@nestjs/common';
import { ScraperManager } from './scraper-manager.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class ScraperService {
  constructor(
    private readonly scraperManager: ScraperManager,
    private readonly jobsService: JobsService,
  ) {}

  async scrape(
    site: string,
    keywords?: string[],
    maxPages: number = 1,
  ): Promise<any[]> {
    const results = await this.scraperManager.scrape(site, keywords, maxPages);

    // Save to database
    if (results.length > 0) {
      const jobDtos = results.map((job) => ({
        company_name: job.company_name,
        title: job.title,
        location: job.location,
        posted_date: job.posted_date,
        deadline: job.deadline,
        link: job.link,
        site: job.site,
        keywords: job.keywords,
      }));

      await this.jobsService.upsertJobs(jobDtos);
    }

    return results;
  }

  getAvailableSites(): string[] {
    return this.scraperManager.getAvailableSites();
  }
}

