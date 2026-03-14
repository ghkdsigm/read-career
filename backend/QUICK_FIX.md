# 빠른 해결 가이드

## 문제: "Could not find the table 'public.jobs' in the schema cache"

이 에러는 Supabase에 `jobs` 테이블이 생성되지 않았을 때 발생합니다.

### 해결 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **다음 SQL 실행**

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

-- RLS 비활성화 (개발 환경용)
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

4. **실행 버튼 클릭** (또는 Ctrl+Enter)

5. **확인**
   - 왼쪽 메뉴에서 "Table Editor" 클릭
   - `jobs` 테이블이 보이는지 확인

6. **백엔드 재시작**
   ```bash
   cd backend
   npm run dev
   ```

### 여전히 에러가 발생하면

1. **테이블이 실제로 생성되었는지 확인**
   - Table Editor에서 `jobs` 테이블 확인
   - 또는 SQL Editor에서 실행:
     ```sql
     SELECT * FROM jobs LIMIT 1;
     ```

2. **RLS 정책 확인**
   - Table Editor에서 `jobs` 테이블 선택
   - "Policies" 탭 확인
   - RLS가 활성화되어 있으면 비활성화하거나 정책 추가

3. **환경 변수 확인**
   - `backend/.env` 파일 확인
   - `SUPABASE_URL`과 `SUPABASE_ANON_KEY`가 올바른지 확인

