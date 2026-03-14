'use client'

import { useState, useEffect } from 'react'
import JobList from '@/components/JobList'
import ScraperControl from '@/components/ScraperControl'

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8001/api/jobs/')
      const data = await response.json()
      if (data.success) {
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI 채용 공고 스크래퍼</h1>
        
        <ScraperControl onScrapeComplete={fetchJobs} />
        
        <div className="mt-8">
          <JobList jobs={jobs} loading={loading} />
        </div>
      </div>
    </main>
  )
}

