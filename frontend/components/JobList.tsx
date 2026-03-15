'use client'

import { useMemo, useState } from 'react'

interface Job {
  id?: string
  company_name: string
  title: string
  location: string
  posted_date?: string
  deadline?: string
  link: string
  site: string
  keywords?: string[]
}

interface JobListProps {
  jobs: Job[]
  loading: boolean
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function getSearchTargets(job: Job): string[] {
  return [job.title, job.company_name, job.location].filter(Boolean)
}

function getDdayText(deadline?: string): string | null {
  if (!deadline) return null

  const normalized = deadline.replace(/\s+/g, '')

  if (normalized.includes('상시채용')) return '상시'
  if (normalized.includes('오늘마감') || normalized.includes('오늘마감!')) return 'D-Day'
  if (normalized.includes('내일마감')) return 'D-1'

  const mmddMatch = normalized.match(/(\d{2})\/(\d{2})/)
  if (!mmddMatch) return null

  const month = Number(mmddMatch[1])
  const day = Number(mmddMatch[2])

  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(today.getFullYear(), month - 1, day)

  const diffMs = target.getTime() - todayOnly.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '마감지남'
  if (diffDays === 0) return 'D-Day'
  return `D-${diffDays}`
}

export default function JobList({ jobs, loading }: JobListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const visibleJobs = useMemo(
    () => jobs.filter((job) => getDdayText(job.deadline) !== '마감지남'),
    [jobs]
  )

  const normalizedSearchTerm = normalizeText(searchTerm)

  const filteredJobs = useMemo(() => {
    if (!normalizedSearchTerm) return visibleJobs

    return visibleJobs.filter((job) =>
      getSearchTargets(job).some((target) =>
        normalizeText(target).includes(normalizedSearchTerm)
      )
    )
  }, [visibleJobs, normalizedSearchTerm])

  const autocompleteOptions = useMemo(() => {
    const uniqueTargets = Array.from(
      new Set(
        visibleJobs.flatMap((job) =>
          getSearchTargets(job).map((target) => target.trim()).filter(Boolean)
        )
      )
    )

    if (!normalizedSearchTerm) return uniqueTargets.slice(0, 20)

    return uniqueTargets
      .filter((target) => normalizeText(target).includes(normalizedSearchTerm))
      .slice(0, 20)
  }, [visibleJobs, normalizedSearchTerm])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    )
  }

  if (visibleJobs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">채용 공고가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-gray-50 border-b space-y-3">
        <h2 className="text-2xl font-semibold">채용 공고 목록 ({filteredJobs.length}개)</h2>
        <div className="space-y-2">
          <label htmlFor="job-search" className="block text-sm font-medium text-gray-700">
            검색 (타이틀 / 회사명 / 지역)
          </label>
          <div className="flex gap-2">
            <input
              id="job-search"
              list="job-search-options"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="예: 백엔드, 네이버, 서울"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
              >
                초기화
              </button>
            )}
          </div>
          <datalist id="job-search-options">
            {autocompleteOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>
      
      <div className="divide-y">
        {filteredJobs.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            검색 조건에 맞는 채용 공고가 없습니다.
          </div>
        )}
        {filteredJobs.map((job, index) => (
          <div key={job.id || index} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  <a href={job.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {job.title}
                  </a>
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">회사:</span> {job.company_name}</p>
                  <p><span className="font-medium">지역:</span> {job.location}</p>
                  {job.posted_date && (
                    <p><span className="font-medium">등록일:</span> {job.posted_date}</p>
                  )}
                  {job.deadline && (
                    <p>
                      <span className="font-medium">마감일:</span> {job.deadline}
                      {getDdayText(job.deadline) && (
                        <span className="ml-2 inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                          {getDdayText(job.deadline)}
                        </span>
                      )}
                    </p>
                  )}
                  <p><span className="font-medium">사이트:</span> {job.site}</p>
                  {job.keywords && job.keywords.length > 0 && (
                    <p>
                      <span className="font-medium">키워드:</span>{' '}
                      <span className="inline-flex gap-1 flex-wrap">
                        {job.keywords.map((keyword, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                보기
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

