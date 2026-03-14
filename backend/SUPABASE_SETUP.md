# Supabase 설정 가이드

## 1. 테이블 생성

Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- jobs 테이블 생성
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
```

## 2. RLS (Row Level Security) 정책 설정

**중요**: Supabase는 기본적으로 RLS가 활성화되어 있습니다. 
테이블에 대한 읽기/쓰기 권한을 허용해야 합니다.

### 방법 1: RLS 비활성화 (개발 환경용)

```sql
-- RLS 비활성화 (개발 환경에서만 사용)
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
```

### 방법 2: RLS 정책 추가 (프로덕션 권장)

```sql
-- RLS 활성화
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 추가
CREATE POLICY "Allow public read access" ON jobs
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입할 수 있도록 정책 추가
CREATE POLICY "Allow public insert access" ON jobs
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트할 수 있도록 정책 추가
CREATE POLICY "Allow public update access" ON jobs
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제할 수 있도록 정책 추가
CREATE POLICY "Allow public delete access" ON jobs
  FOR DELETE
  USING (true);
```

## 3. 확인

테이블이 제대로 생성되었는지 확인:

```sql
SELECT * FROM jobs LIMIT 10;
```

## 문제 해결

### 에러: "relation 'jobs' does not exist"
- 테이블이 생성되지 않았습니다. 위의 SQL을 실행하세요.

### 에러: "new row violates row-level security policy"
- RLS 정책이 설정되지 않았습니다. 위의 RLS 정책을 추가하세요.

### 에러: "permission denied for table jobs"
- ANON_KEY에 권한이 없습니다. RLS 정책을 확인하세요.

