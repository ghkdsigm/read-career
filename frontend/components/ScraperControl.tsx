'use client'

import { useState } from 'react'

interface ScraperControlProps {
  onScrapeComplete: () => void
}

export default function ScraperControl({ onScrapeComplete }: ScraperControlProps) {
  const [scraping, setScraping] = useState(false)
  const [site, setSite] = useState('jobkorea')
  const [maxPages, setMaxPages] = useState(1)
  const [message, setMessage] = useState('')

  const handleScrape = async () => {
    setScraping(true)
    setMessage('')
    
    try {
      const response = await fetch('http://localhost:8001/api/scraper/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site,
          max_pages: maxPages,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`성공! ${data.count}개의 채용 공고를 찾았습니다.`)
        onScrapeComplete()
      } else {
        setMessage('스크래핑 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setMessage('스크래핑 중 오류가 발생했습니다.')
      console.error('Error:', error)
    } finally {
      setScraping(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">스크래퍼 제어</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">사이트 선택</label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="jobkorea">JobKorea</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">최대 페이지 수</label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          onClick={handleScrape}
          disabled={scraping}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {scraping ? '스크래핑 중...' : '스크래핑 시작'}
        </button>

        {message && (
          <div className={`p-3 rounded-md ${message.includes('성공') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

