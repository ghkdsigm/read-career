# Read Career - AI 채용 공고 스크래퍼

JobKorea 등 여러 채용 사이트에서 AI 관련 채용 공고를 자동으로 수집하는 모노레포 프로젝트입니다.

## 프로젝트 구조

```
read-career/
├── backend/          # NestJS 백엔드
│   ├── src/
│   │   ├── scraper/  # 스크래퍼 모듈 (확장 가능한 구조)
│   │   ├── jobs/     # 채용 공고 모듈
│   │   └── main.ts   # NestJS 앱 진입점
│   └── package.json
├── frontend/         # Next.js 프론트엔드
│   ├── app/          # Next.js App Router
│   └── components/   # React 컴포넌트
└── package.json      # 모노레포 루트 설정
```

## 기능

- ✅ JobKorea에서 AI 관련 채용 공고 스크래핑
- ✅ 키워드 필터링 (AI 기획자, AI 서비스 기획, AI 전략 기획, AI 설계, AI PM 등)
- ✅ Supabase를 통한 데이터 저장 및 조회
- ✅ 확장 가능한 스크래퍼 구조 (다른 사이트 추가 용이)
- ✅ 모던한 웹 UI

## 시작하기

### 1. 환경 설정

```bash
# 루트 디렉토리에서 모든 의존성 설치
npm run install:all
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. `backend/.env` 파일 생성:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8001
NODE_ENV=development
```

3. Supabase에서 `jobs` 테이블 생성:

```sql
-- 테이블 생성
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  posted_date TEXT,
  deadline TEXT,
  link TEXT UNIQUE NOT NULL,
  site TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_jobs_site ON jobs(site);
CREATE INDEX IF NOT EXISTS idx_jobs_link ON jobs(link);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- RLS 정책 설정 (개발 환경용 - 모든 접근 허용)
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

**중요**: Supabase는 기본적으로 RLS(Row Level Security)가 활성화되어 있어 접근이 차단될 수 있습니다. 
개발 환경에서는 위의 `DISABLE ROW LEVEL SECURITY`를 사용하거나, 프로덕션 환경에서는 RLS 정책을 추가하세요.
(자세한 내용은 `backend/SUPABASE_SETUP.md` 참고)

### 3. 개발 서버 실행

```bash
# 백엔드와 프론트엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:backend  # http://localhost:8001
npm run dev:frontend # http://localhost:3000
```

## API 엔드포인트

### 스크래퍼

- `POST /api/scraper/scrape` - 채용 공고 스크래핑 시작
- `GET /api/scraper/sites` - 사용 가능한 스크래퍼 사이트 목록

### 채용 공고

- `GET /api/jobs/` - 채용 공고 목록 조회
- `POST /api/jobs/` - 채용 공고 생성
- `DELETE /api/jobs/{job_id}` - 채용 공고 삭제

## 스크래퍼 확장

새로운 사이트를 추가하려면:

1. `backend/src/scraper/scrapers/` 폴더에 새 스크래퍼 서비스 생성
2. `BaseScraper`를 상속받아 구현
3. `ScraperManager`에 등록

예시:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base-scraper.service';
import { JobPosting } from '../interfaces/job-posting.interface';

@Injectable()
export class NewSiteScraper extends BaseScraper {
  siteName = 'newsite';

  async scrape(keywords?: string[], maxPages: number = 1): Promise<JobPosting[]> {
    // 스크래핑 로직 구현
    return [];
  }
}
```

그리고 `scraper.module.ts`에서 provider로 등록하고 `scraper-manager.service.ts`에서 등록하세요.

## 기술 스택

- **Backend**: Node.js, NestJS, TypeScript, Selenium WebDriver, Cheerio
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)

## 라이선스

MIT
