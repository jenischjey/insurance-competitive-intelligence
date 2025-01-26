import { NextResponse } from 'next/server';

const API_BASE_URL = 'http://localhost:8000'; // Adjust port if different

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    const apiFormData = new FormData();
    files.forEach(file => {
      apiFormData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'POST',
      body: apiFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to upload documents');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to get documents');
    }

    // If there's a message about no documents, return empty array
    if (data.message === "No documents loaded") {
      return NextResponse.json({
        message: "No documents loaded",
        documents: []
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting documents:', error);
    return NextResponse.json({
      message: "No documents loaded",
      documents: []
    }, { status: 200 }); // Return 200 for empty state
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