import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:8000'; // Adjust port if different

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward the file to FastAPI
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'POST',
      body: apiFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to upload document');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to delete documents');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting documents:', error);
    return NextResponse.json(
      { error: 'Failed to delete documents' },
      { status: 500 }
    );
  }
} 