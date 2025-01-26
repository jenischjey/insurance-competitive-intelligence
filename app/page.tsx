'use client'
import { useState, FormEvent, useEffect } from 'react'
import { QueryResponse } from './types'

interface LoadedDocument {
  filename: string;
  size?: number;
}

export default function AIChatPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [references, setReferences] = useState<string[]>([])
  const [response, setResponse] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [questionHistory, setQuestionHistory] = useState<Array<{question: string; answer: string}>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [loadedDocuments, setLoadedDocuments] = useState<LoadedDocument[]>([])
  const [expandedRefs, setExpandedRefs] = useState<{ [key: number]: boolean }>({})

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

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      if (data.documents) {
        setLoadedDocuments(data.documents)
      } else {
        setLoadedDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setLoadedDocuments([])
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true)
      setUploadStatus('uploading')
      
      const formData = new FormData()
      Array.from(e.target.files).forEach(file => {
        if (!file.name.endsWith('.xlsx')) {
          alert('Please upload only Excel (.xlsx) files')
          return
        }
        formData.append('files', file)
      })

      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload files')
        }

        setUploadStatus('success')
        await fetchDocuments()
        
        e.target.value = ''
        
        setTimeout(() => {
          setUploadStatus('idle')
        }, 3000)
      } catch (error) {
        console.error('Error uploading files:', error)
        setUploadStatus('error')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const toggleReference = (index: number) => {
    setExpandedRefs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload 10K Filings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  accept=".xlsx"
                  multiple
                  disabled={isUploading}
                />
                <button 
                  type="button" 
                  className={`px-4 py-2 bg-navy-600 text-white rounded-lg transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-navy-700'
                  }`}
                >
                  Choose Files
                </button>
              </div>
            </div>
            
            {/* Upload Status Section */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Status:</h3>
              <div className="min-h-[50px] border border-gray-200 rounded-lg p-3">
                {uploadStatus === 'uploading' && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="animate-spin h-5 w-5 text-navy-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Uploading files...</span>
                  </div>
                )}
                
                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Files uploaded successfully!</span>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Error uploading files. Please try again.</span>
                  </div>
                )}
                
                {uploadStatus !== 'uploading' && (
                  loadedDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {loadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{doc.filename}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No files uploaded yet
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="col-span-2 space-y-4">
            {/* Question History */}
            <div className="bg-white rounded-lg p-4 shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Answers</h2>
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
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Reference Materials</h3>
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ) : references.length > 0 ? (
                  <div className="space-y-4">
                    {references.map((ref, index) => {
                      const isExpanded = expandedRefs[index] || false;
                      const shouldTruncate = ref.length > 200;
                      const displayText = shouldTruncate && !isExpanded 
                        ? ref.slice(0, 200) + '...' 
                        : ref;

                      return (
                        <div 
                          key={index} 
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <svg 
                              className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                              />
                            </svg>
                            <div className="space-y-2 flex-1">
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {displayText}
                              </div>
                              {shouldTruncate && (
                                <button
                                  onClick={() => toggleReference(index)}
                                  className="text-navy-600 hover:text-navy-700 text-sm font-medium flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      Show Less
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      Show More
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg 
                      className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <p className="text-sm">No reference materials available</p>
                    <p className="text-xs text-gray-400 mt-1">References will appear here when you ask a question</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}