'use client'

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
  const visibleJobs = jobs.filter((job) => getDdayText(job.deadline) !== '마감지남')

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
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-2xl font-semibold">채용 공고 목록 ({visibleJobs.length}개)</h2>
      </div>
      
      <div className="divide-y">
        {visibleJobs.map((job, index) => (
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

