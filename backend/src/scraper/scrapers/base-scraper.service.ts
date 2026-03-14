import { JobPosting } from '../interfaces/job-posting.interface';

export abstract class BaseScraper {
  abstract siteName: string;

  abstract scrape(
    keywords?: string[],
    maxPages?: number,
  ): Promise<JobPosting[]>;

  filterByKeywords(
    postings: JobPosting[],
    keywords: string[],
  ): JobPosting[] {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9가-힣]/g, '');

    const filtered: JobPosting[] = [];
    const normalizedKeywordMap = (keywords || []).map((k) => ({
      original: k,
      normalized: normalize(k),
    }));

    // 규칙 기반 필터: "AI + (기획/PM/PO/전략/서비스/프로덕트 ...)"이면 포함
    const aiTerms = ['ai', '인공지능'].map(normalize);
    const planningOrPmTerms = [
      '기획',
      '기획자',
      '서비스기획',
      '사업기획',
      '상품기획',
      '전략',
      '사업전략',
      '서비스',
      '프로덕트',
      '매니저',
      'pm',
      'po',
      'productmanager',
      'productowner',
      'product',
      'planner',
      'planning',
      '로드맵',
    ].map(normalize);
    
    for (const posting of postings) {
      const normalizedTitle = normalize(posting.title);

      let matched = false;
      const matchedLabels: string[] = [];

      // 1) 기존 키워드 매칭
      for (const keyword of normalizedKeywordMap) {
        if (keyword.normalized && normalizedTitle.includes(keyword.normalized)) {
          matched = true;
          matchedLabels.push(keyword.original);
        }
      }

      // 2) 규칙 기반 매칭 (AI + 기획/PM 관련)
      const hasAi = aiTerms.some((term) => normalizedTitle.includes(term));
      const hasPlanningOrPm = planningOrPmTerms.some((term) =>
        normalizedTitle.includes(term),
      );
      if (hasAi && hasPlanningOrPm) {
        matched = true;
        matchedLabels.push('AI+기획/PM');
      }

      if (matched) {
        if (!posting.keywords) {
          posting.keywords = [];
        }
        for (const label of matchedLabels) {
          if (!posting.keywords.includes(label)) {
            posting.keywords.push(label);
          }
        }
        filtered.push(posting);
      }
    }

    console.log(
      `Filtered ${postings.length} postings to ${filtered.length} using keywords/rules`,
    );
    return filtered;
  }
}

