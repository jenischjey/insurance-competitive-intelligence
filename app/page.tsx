'use client'
import { useState, FormEvent } from 'react'
import { QueryResponse } from './types'

export default function AIChatPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [references, setReferences] = useState<string[]>([])
  const [response, setResponse] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [questionHistory, setQuestionHistory] = useState<Array<{question: string; answer: string}>>([])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setReferences([])
    
    try {
      const result = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      if (!result.ok) {
        throw new Error('Failed to process query')
      }

      const data: QueryResponse = await result.json()
      setReferences(data.sources)
      setResponse(data.response)
      setQuestionHistory(prev => [...prev, { question: query, answer: data.response }])
      setQuery('')
    } catch (error) {
      console.error('Error processing query:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        setUploadedFiles(prev => [...prev, file])
        e.target.value = ''
      } catch (error) {
        console.error('Error uploading file:', error)
        // Add error handling UI here
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-navy-600 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">
          Insurance Competitive Intelligence
        </h1>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* File Upload Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Reference Documents</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  accept=".xlsx"
                />
                <button 
                  type="button" 
                  className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
            
            {/* Display uploaded files */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {file.name}
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFiles(files => files.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                  No files uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="col-span-2 space-y-4">
            {/* Question History */}
            <div className="bg-white rounded-lg p-4 shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Chat History</h2>
              {questionHistory.length > 0 ? (
                <div className="space-y-4">
                  {questionHistory.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="font-medium text-gray-800 mb-2">Q: {item.question}</div>
                      <div className="text-gray-600">A: {item.answer}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No questions asked yet. Start by typing a question below!
                </div>
              )}
            </div>

            {/* Question Input and Submit Button */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                placeholder="Ask your question..."
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="w-full py-2 px-4 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Submit Question'}
              </button>
            </form>

            {isLoading && (
              <div className="animate-pulse bg-white rounded-lg p-4 shadow-md">
                <div className="text-gray-600">Generating response...</div>
              </div>
            )}
          </div>

          {/* References Panel */}
          <div className="col-span-1">
            <div className="sticky top-6">
              <h3 className="font-semibold mb-3 text-gray-800">Reference Materials</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-purple-500 animate-pulse" />
                      <div className="text-sm text-gray-600">
                        Downloading {ref}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : references.length > 0 && (
                <div className="space-y-2">
                  {references.map((ref, index) => (
                    <div key={index} className="p-2 bg-white rounded shadow-sm text-sm text-gray-800">
                      {ref}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}