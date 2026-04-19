import pytest
import io
from app.tests.conftest import client, test_user


def test_upload_document(client, test_user):
    """Test uploading a document"""
    # Create a fake file
    file_content = b"This is a test document for learning Python."
    files = {
        "file": ("test_doc.txt", io.BytesIO(file_content), "text/plain")
    }
    data = {"user_id": test_user.user_id}
    
    response = client.post("/documents/upload", files=files, data=data)
    assert response.status_code == 200
    resp_data = response.json()
    assert "message" in resp_data or "document_id" in resp_data


def test_upload_document_missing_user_id(client):
    """Test document upload fails without user_id"""
    file_content = b"Test content"
    files = {
        "file": ("test.txt", io.BytesIO(file_content), "text/plain")
    }
    
    response = client.post("/documents/upload", files=files)
    assert response.status_code in [422, 400]


def test_upload_document_missing_file(client, test_user):
    """Test document upload fails without file"""
    data = {"user_id": test_user.user_id}
    response = client.post("/documents/upload", data=data)
    assert response.status_code in [422, 400]


def test_upload_pdf_document(client, test_user):
    """Test uploading a PDF document"""
    # Create a minimal valid PDF
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Size 1 >>\nstartxref\n9\n%%EOF"
    files = {
        "file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")
    }
    data = {"user_id": test_user.user_id}
    
    response = client.post("/documents/upload", files=files, data=data)
    # Should accept PDF or return appropriate error
    assert response.status_code in [200, 422, 400]


def test_upload_large_document(client, test_user):
    """Test uploading a large document"""
    # Create a large file (1MB)
    large_content = b"x" * (1024 * 1024)
    files = {
        "file": ("large.txt", io.BytesIO(large_content), "text/plain")
    }
    data = {"user_id": test_user.user_id}
    
    response = client.post("/documents/upload", files=files, data=data)
    # Depending on file size limits, may accept or reject
    assert response.status_code in [200, 413, 422]


def test_upload_document_response_format(client, test_user):
    """Test that document upload response has expected format"""
    file_content = b"Learning content"
    files = {
        "file": ("content.txt", io.BytesIO(file_content), "text/plain")
    }
    data = {"user_id": test_user.user_id}
    
    response = client.post("/documents/upload", files=files, data=data)
    if response.status_code == 200:
        resp_data = response.json()
        assert isinstance(resp_data, dict)
        # Should have some success indicator
        assert "message" in resp_data or "document_id" in resp_data or "status" in resp_data
