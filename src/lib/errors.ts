import { NextResponse } from 'next/server'

export class APIError extends Error {
  public statusCode: number
  public details?: any

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, details)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string = 'External service error', details?: any) {
    super(`${service}: ${message}`, 502, details)
    this.name = 'ExternalServiceError'
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message,
        ...(error.details && { details: error.details })
      },
      { status: error.statusCode }
    )
  }

  console.error('Unhandled error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}