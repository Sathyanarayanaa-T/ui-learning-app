"""Document service for handling file uploads and text extraction - Chatbot Service."""

import os
import tempfile
from typing import Optional, Dict, List
import uuid
from datetime import datetime

# PDF parsing
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

# DOCX parsing
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

# Image text extraction (OCR)
try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None


class DocumentService:
    """Service for handling document upload, parsing, and analysis."""
    
    # Store documents in memory (in production, use database)
    _documents = {}
    
    def __init__(self):
        """Initialize document service with supported formats."""
        self.supported_formats = {
            'pdf': '.pdf',
            'docx': '.docx',
            'doc': '.doc',
            'jpg': '.jpg',
            'jpeg': '.jpeg',
            'png': '.png',
            'txt': '.txt'
        }
    
    def upload_and_extract(self, file_path: str, filename: str, session_id: str) -> Dict:
        """
        Upload document and extract text content.
        
        Args:
            file_path: Path to uploaded file
            filename: Original filename
            session_id: Session ID for associating document
        
        Returns:
            Dictionary with document info and extracted content
        """
        try:
            file_ext = os.path.splitext(filename)[1].lower().lstrip('.')
            
            # Validate file type
            if file_ext not in self.supported_formats:
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Extract content based on file type
            if file_ext == 'pdf':
                content = self._extract_pdf(file_path)
            elif file_ext == 'docx':
                content = self._extract_docx(file_path)
            elif file_ext in ['txt']:
                content = self._extract_txt(file_path)
            elif file_ext in ['jpg', 'jpeg', 'png']:
                content = self._extract_image_text(file_path)
            else:
                raise ValueError(f"File type {file_ext} extraction not implemented")
            
            # Create document record
            doc_id = str(uuid.uuid4())
            doc_info = {
                'id': doc_id,
                'filename': filename,
                'file_type': file_ext,
                'session_id': session_id,
                'content': content,
                'content_length': len(content),
                'uploaded_at': datetime.now().isoformat(),
                'is_analyzed': True
            }
            
            # Store document
            self._documents[doc_id] = doc_info
            
            return {
                'status': 'success',
                'document_id': doc_id,
                'filename': filename,
                'file_type': file_ext,
                'content_preview': content[:200] + '...' if len(content) > 200 else content,
                'total_characters': len(content),
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        if not PyPDF2:
            raise ImportError("PyPDF2 not installed. Install it for PDF support.")
        
        text = ""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text()
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")
        
        return text
    
    def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        if not DocxDocument:
            raise ImportError("python-docx not installed. Install it for DOCX support.")
        
        text = ""
        try:
            doc = DocxDocument(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")
        
        return text
    
    def _extract_txt(self, file_path: str) -> str:
        """Extract text from TXT file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"TXT extraction failed: {str(e)}")
    
    def _extract_image_text(self, file_path: str) -> str:
        """Extract text from image using OCR."""
        if not Image or not pytesseract:
            raise ImportError("PIL and pytesseract not installed. Install for OCR support.")
        
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            raise Exception(f"Image text extraction failed: {str(e)}")
    
    def get_document(self, doc_id: str) -> Optional[Dict]:
        """Retrieve a document by ID."""
        return self._documents.get(doc_id)
    
    def list_documents(self, session_id: Optional[str] = None) -> List[Dict]:
        """List all documents, optionally filtered by session."""
        if session_id:
            return [
                {
                    'id': doc['id'],
                    'filename': doc['filename'],
                    'file_type': doc['file_type'],
                    'content_length': doc['content_length'],
                    'uploaded_at': doc['uploaded_at']
                }
                for doc in self._documents.values()
                if doc['session_id'] == session_id
            ]
        
        return [
            {
                'id': doc['id'],
                'filename': doc['filename'],
                'file_type': doc['file_type'],
                'content_length': doc['content_length'],
                'uploaded_at': doc['uploaded_at']
            }
            for doc in self._documents.values()
        ]
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document."""
        if doc_id in self._documents:
            del self._documents[doc_id]
            return True
        return False


# Global document service instance
document_service = DocumentService()
