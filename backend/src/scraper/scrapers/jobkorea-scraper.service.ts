import { Injectable } from '@nestjs/common';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { BaseScraper } from './base-scraper.service';
import { JobPosting } from '../interfaces/job-posting.interface';
import * as cheerio from 'cheerio';

@Injectable()
export class JobKoreaScraper extends BaseScraper {
  siteName = 'jobkorea';
  private baseUrl = 'https://www.jobkorea.co.kr/Search/';
  private defaultKeywords = [
    'AI 기획자',
    'AI기획자',
    'AI 서비스 기획',
    'AI서비스기획',
    'AI 전략 기획',
    'AI전략기획',
    'AI 사업 기획',
    'AI사업기획',
    'AI 설계',
    'AI PM',
    'AIPM',
    'AI PO',
    'AIPO',
    'AI Product Manager',
    'AI 프로덕트 매니저',
  ];

  private async setupDriver(): Promise<WebDriver> {
    const options = new chrome.Options();
    
    // 헤드리스 모드 (디버깅 시 주석 처리)
    // options.addArguments('--headless');
    
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--window-size=1920,1080');
    options.addArguments(
      'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    options.excludeSwitches('enable-automation');
    options.set('useAutomationExtension', false);

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    return driver;
  }

  async scrape(
    keywords?: string[],
    maxPages: number = 1,
  ): Promise<JobPosting[]> {
    if (!keywords) {
      keywords = this.defaultKeywords;
    }

    const driver = await this.setupDriver();
    const allPostings: JobPosting[] = [];

    try {
      for (let page = 1; page <= maxPages; page++) {
        // recruit 탭 고정: "총 N건 / 합격축하금만 보기" 아래 본문 리스트 대상으로 스크래핑
        const url = `${this.baseUrl}?stext=AI%20기획&Page_No=${page}&tabType=recruit`;
        await driver.get(url);

        // 페이지 로딩 대기
        await driver.sleep(3000);

        // 동적 콘텐츠 로딩 대기 - 여러 셀렉터 시도
        let elementFound = false;
        const selectors = [
          By.className('list-default'),
          By.css('.list-post'),
          By.css('a[href*="/Recruit/GI_Read/"]'),
          By.css('.devList'),
        ];
        
        for (const selector of selectors) {
          try {
            await driver.wait(until.elementLocated(selector), 5000);
            elementFound = true;
            console.log(`Found element with selector: ${selector}`);
            break;
          } catch (e) {
            // 다음 셀렉터 시도
          }
        }
        
        if (!elementFound) {
          console.log('Warning: No expected elements found, proceeding anyway...');
        }
        
        // 추가 대기 시간 (동적 콘텐츠 로딩)
        await driver.sleep(2000);

        // 페이지 소스 파싱
        const pageSource = await driver.getPageSource();
        
        // 디버깅: HTML 길이 확인
        console.log(`Page ${page}: HTML length = ${pageSource.length}`);
        
        const postings = this.parsePage(pageSource);
        allPostings.push(...postings);

        console.log(`Page ${page}: Found ${postings.length} postings`);
        
        // 디버깅: 첫 번째 포스팅 정보 출력
        if (postings.length > 0) {
          console.log(`First posting: ${postings[0].title}`);
        } else {
          console.log('No postings found. Checking HTML structure...');
          // HTML 일부 출력하여 구조 확인
          const htmlSample = pageSource.substring(0, 2000);
          console.log('HTML sample:', htmlSample);
        }
      }
    } catch (error) {
      console.error(`Error during scraping: ${error}`);
      throw error;
    } finally {
      await driver.quit();
    }

    console.log(`Total postings before filtering: ${allPostings.length}`);
    console.log(`Filtering keywords: ${keywords?.join(', ')}`);
    
    // 키워드로 필터링
    const filteredPostings = this.filterByKeywords(allPostings, keywords);
    
    console.log(`Total postings after filtering: ${filteredPostings.length}`);
    
    if (filteredPostings.length === 0 && allPostings.length > 0) {
      console.log('Warning: All postings were filtered out. Showing first 5 titles:');
      allPostings.slice(0, 5).forEach((posting, i) => {
        console.log(`  ${i + 1}. ${posting.title}`);
      });
    }

    return filteredPostings;
  }

  private parsePage(html: string): JobPosting[] {
    // 본문 리스트 시작 지점으로 HTML 범위를 축소해서 상단 "지금 주목할 만한 공고" 배제
    let scopedHtml = html;
    const markerIdx = html.indexOf('합격축하금만 보기');
    if (markerIdx > -1) {
      scopedHtml = html.slice(markerIdx);
      console.log('Scoped parsing from marker: 합격축하금만 보기');
    } else {
      console.log('Marker not found, using full HTML for parsing');
    }

    const $ = cheerio.load(scopedHtml);
    const postings: JobPosting[] = [];

    // JobKorea의 채용 공고 리스트 구조 파싱 - 여러 셀렉터 시도
    let jobItems: any[] = [];
    
    // 1순위: JobList 컨테이너 내부만 파싱 (상단 광고/주목 공고 제외)
    const jobListContainer = $('[data-sentry-component="JobList"]').first();
    if (jobListContainer.length > 0) {
      const links = jobListContainer.find('a[href*="/Recruit/GI_Read/"]');
      const seen = new Set<any>();
      links.each((i, elem) => {
        const $link = $(elem);
        let $candidate = $link;

        // 링크에서 카드 컨테이너까지 상향 탐색
        for (let depth = 0; depth < 8; depth++) {
          const $parent = $candidate.parent();
          if (!$parent.length || $parent.is('[data-sentry-component="JobList"]')) {
            break;
          }
          $candidate = $parent;
          if ($candidate.is('li, article, tr') || $candidate.find('img[alt*="로고"]').length > 0) {
            break;
          }
        }

        const node = $candidate.get(0);
        if (node && !seen.has(node)) {
          seen.add(node);
          jobItems.push(node);
        }
      });
      console.log(`Found items using [data-sentry-component=\"JobList\"]: ${jobItems.length}`);
    }
    // 다양한 셀렉터 시도 (fallback)
    else if ($('.list-default .list-post').length > 0) {
      jobItems = $('.list-default .list-post').toArray();
      console.log('Found items using .list-default .list-post');
    } else if ($('.list-post').length > 0) {
      jobItems = $('.list-post').toArray();
      console.log('Found items using .list-post');
    } else if ($('li[class*="list"]').length > 0) {
      jobItems = $('li[class*="list"]').toArray();
      console.log('Found items using li[class*="list"]');
    } else if ($('.devList .list').length > 0) {
      jobItems = $('.devList .list').toArray();
      console.log('Found items using .devList .list');
    } else if ($('a[href*="/Recruit/GI_Read/"]').length > 0) {
      // 링크 기준으로 카드 컨테이너를 탐색해 본문 리스트만 수집
      const links = $('a[href*="/Recruit/GI_Read/"]');
      const seen = new Set<any>();
      links.each((i, elem) => {
        const $link = $(elem);
        let $candidate = $link;

        // 카드 컨테이너로 보이는 ancestor를 상향 탐색
        for (let depth = 0; depth < 8; depth++) {
          const $parent = $candidate.parent();
          if (!$parent.length) {
            break;
          }
          $candidate = $parent;

          const hasLogo = $candidate.find('img[alt*="로고"]').length > 0;
          const hasLocation =
            $candidate.find('span.loc, .location, .loc, [class*="loc"]').length > 0;
          const hasDateLike = /(등록|마감)/.test($candidate.text());
          const isCardTag = $candidate.is('li, article, tr');
          if (hasLogo || hasLocation || hasDateLike || isCardTag) {
            break;
          }
        }

        const node = $candidate.get(0);
        if (node && !seen.has(node)) {
          seen.add(node);
          jobItems.push(node);
        }
      });
      console.log(
        `Found items using a[href*="/Recruit/GI_Read/"] (main-list filtered): ${jobItems.length}`,
      );
    } else {
      console.log('No job items found with any selector');
      console.log('Available classes:', $('[class]').map((i, el) => $(el).attr('class')).get().slice(0, 20).join(', '));
    }

    for (const item of jobItems) {
      try {
        const $item = $(item);

        // 제목 및 링크 추출 - 여러 방법 시도
        let titleElem = $item.find('a.title').first();
        if (!titleElem.length) {
          titleElem = $item.find('a[href*="/Recruit/GI_Read/"]').first();
        }
        if (!titleElem.length) {
          titleElem = $item.find('a[href*="/Recruit/"]').first();
        }
        if (!titleElem.length) {
          titleElem = $item.find('a').first();
        }
        if (!titleElem.length) {
          // 링크가 없으면 스킵
          continue;
        }

        const title = titleElem.text().trim();
        let link = titleElem.attr('href') || '';

        if (!title || !link) {
          continue;
        }
        
        // 제목이 너무 짧거나 의미없는 경우 스킵
        if (title.length < 5) {
          continue;
        }

        if (link && !link.startsWith('http')) {
          link = `https://www.jobkorea.co.kr${link}`;
        }

        // 회사명 추출: 로고 이미지 alt 값 우선 (예: "삼성생명㈜ 로고" -> "삼성생명㈜")
        let companyName = 'Unknown';
        const logoImg = $item.find('img[alt*="로고"]').first();
        if (logoImg.length) {
          const alt = (logoImg.attr('alt') || '').trim();
          const cleaned = alt.replace(/\s*로고\s*$/g, '').trim();
          if (cleaned) {
            companyName = cleaned;
          }
        }
        if (companyName === 'Unknown') {
          // 부모/형제 요소에서 로고 alt 재시도
          const parentLogo = $item
            .parent()
            .find('img[alt*="로고"]')
            .first();
          if (parentLogo.length) {
            const alt = (parentLogo.attr('alt') || '').trim();
            const cleaned = alt.replace(/\s*로고\s*$/g, '').trim();
            if (cleaned) {
              companyName = cleaned;
            }
          }
        }
        if (companyName === 'Unknown') {
          const siblingLogo = $item
            .siblings()
            .find('img[alt*="로고"]')
            .first();
          if (siblingLogo.length) {
            const alt = (siblingLogo.attr('alt') || '').trim();
            const cleaned = alt.replace(/\s*로고\s*$/g, '').trim();
            if (cleaned) {
              companyName = cleaned;
            }
          }
        }
        if (companyName === 'Unknown') {
          // fallback: 기존 텍스트 기반 추출
          let companyElem = $item.find('.post-list-corp').first();
          if (!companyElem.length) {
            companyElem = $item.find('a.name').first();
          }
          if (!companyElem.length) {
            companyElem = $item.find('.corp').first();
          }
          if (!companyElem.length) {
            companyElem = $item.find('[class*="corp"]').first();
          }
          if (!companyElem.length) {
            companyElem = $item.find('[class*="company"]').first();
          }
          if (!companyElem.length) {
            const parent = $item.parent();
            companyElem = parent.find('.post-list-corp, a.name, .corp, [class*="corp"]').first();
          }
          if (!companyElem.length) {
            const siblings = $item.siblings();
            companyElem = siblings.find('.post-list-corp, a.name, .corp, [class*="corp"]').first();
          }
          if (companyElem.length) {
            companyName = companyElem.text().trim();
          }
        }
        
        // 디버깅: 첫 번째 아이템의 HTML 구조 출력
        if (postings.length === 0) {
          console.log('Sample item HTML:', $item.html()?.substring(0, 500));
        }

        // 지역 추출 - 여러 방법 시도
        let locationElem = $item.find('span.loc').first();
        let location = 'Unknown';
        if (!locationElem.length) {
          locationElem = $item.find('.location').first();
        }
        if (!locationElem.length) {
          locationElem = $item.find('.loc').first();
        }
        if (!locationElem.length) {
          locationElem = $item.find('[class*="loc"]').first();
        }
        if (!locationElem.length) {
          // 부모 요소에서 지역 찾기
          const parent = $item.parent();
          locationElem = parent.find('span.loc, .location, .loc, [class*="loc"]').first();
        }
        if (!locationElem.length) {
          // 형제 요소에서 찾기
          const siblings = $item.siblings();
          locationElem = siblings.find('span.loc, .location, .loc, [class*="loc"]').first();
        }
        if (locationElem.length) {
          location = locationElem.text().trim();
        } else {
          // 텍스트에서 지역 패턴 찾기 (예: "서울 강남구", "경기 성남시" 등)
          const itemText = $item.text();
          const locationPattern = /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+[가-힣]+(구|시|군|동)?/;
          const locationMatch = itemText.match(locationPattern);
          if (locationMatch) {
            location = locationMatch[0];
          }
        }

        // 날짜 및 마감일 추출
        const itemText = $item.text();
        const datePattern = /(\d{2}\/\d{2}\([월화수목금토일]\))\s*(등록|마감)/g;
        const dates: Array<[string, string]> = [];
        let match;

        while ((match = datePattern.exec(itemText)) !== null) {
          dates.push([match[1], match[2]]);
        }

        let postedDate: string | undefined;
        let deadline: string | undefined;

        for (const [dateStr, typeStr] of dates) {
          if (typeStr === '등록') {
            postedDate = dateStr;
          } else if (typeStr === '마감') {
            deadline = dateStr;
          }
        }

        // 날짜 요소로 직접 찾기
        if (!postedDate) {
          const dateElem = $item.find('span.date').first();
          if (dateElem.length) {
            postedDate = dateElem.text().trim();
          }
        }

        if (!deadline) {
          const deadlineElem = $item.find('span.deadline').first();
          if (deadlineElem.length) {
            deadline = deadlineElem.text().trim();
          }
        }

        const posting: JobPosting = {
          company_name: companyName,
          title,
          location,
          posted_date: postedDate,
          deadline,
          link,
          site: this.siteName,
          keywords: [],
        };

        // 디버깅: 첫 번째 포스팅의 상세 정보 출력
        if (postings.length === 0) {
          console.log('First posting details:', {
            title,
            company: companyName,
            location,
            link: link.substring(0, 100),
          });
        }

        postings.push(posting);
      } catch (error) {
        console.error(`Error parsing job item: ${error}`);
        continue;
      }
    }

    return postings;
  }
}

