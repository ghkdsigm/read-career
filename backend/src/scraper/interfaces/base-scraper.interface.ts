import { JobPosting } from './job-posting.interface';

export interface IBaseScraper {
  siteName: string;
  scrape(keywords?: string[], maxPages?: number): Promise<JobPosting[]>;
  filterByKeywords(postings: JobPosting[], keywords: string[]): JobPosting[];
}

