import { Injectable } from '@nestjs/common';
import { JobKoreaScraper } from './scrapers/jobkorea-scraper.service';
import { IBaseScraper } from './interfaces/base-scraper.interface';
import { JobPosting } from './interfaces/job-posting.interface';

@Injectable()
export class ScraperManager {
  private scrapers: Map<string, IBaseScraper> = new Map();

  constructor(private readonly jobKoreaScraper: JobKoreaScraper) {
    this.registerScraper('jobkorea', jobKoreaScraper);
  }

  registerScraper(siteName: string, scraper: IBaseScraper): void {
    this.scrapers.set(siteName, scraper);
  }

  getAvailableSites(): string[] {
    return Array.from(this.scrapers.keys());
  }

  async scrape(
    site: string,
    keywords?: string[],
    maxPages: number = 1,
  ): Promise<JobPosting[]> {
    const scraper = this.scrapers.get(site);
    if (!scraper) {
      throw new Error(
        `Unknown site: ${site}. Available sites: ${this.getAvailableSites().join(', ')}`,
      );
    }

    return await scraper.scrape(keywords, maxPages);
  }
}

