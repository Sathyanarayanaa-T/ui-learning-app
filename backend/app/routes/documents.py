"""Document upload and analysis routes."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import uuid
import os
import tempfile
from datetime import datetime

from ..models.document_models import (
    DocumentUploadResponse, DocumentInfo, DocumentQuestion, 
    DocumentQuestionResponse, DocumentList
)
from ..services.chatbot import document_service, session_service, analytics_service
from ..services.core import ai_service, prompt_builder
from ..core.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, JPG, JPEG, PNG, TXT)"),
    session_id: str = Query(..., description="Session ID to associate document with")
):
    """
    **Upload and Analyze Document**
    
    Supported formats:
    - PDF (.pdf) - Extracts all text from all pages
    - Word (.docx, .doc) - Extracts paragraphs and table content
    - Images (.jpg, .jpeg, .png) - OCR text extraction
    - Text (.txt) - Plain text files
    
    **Returns:** Document ID + Preview + Character count
    
    After upload, use document ID to ask questions about the document.
    """
    try:
        # Validate session
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"temp_{uuid.uuid4()}_{file.filename}")
        
        try:
            # Save uploaded file
            with open(temp_file_path, "wb") as buffer:
                buffer.write(contents)
            
            # Extract and analyze document
            result = document_service.upload_and_extract(
                temp_file_path, file.filename, session_id
            )
            
            if result['status'] != 'success':
                raise HTTPException(status_code=400, detail=result.get('message', 'Upload failed'))
            
            # Log analytics
            analytics_service.log_query(
                query_id=str(uuid.uuid4()),
                session_id=session_id,
                message=f"Uploaded document: {file.filename}",
                mode="document_upload",
                response_time=0.0
            )
            
            return DocumentUploadResponse(
                status="success",
                document_id=result['document_id'],
                filename=result['filename'],
                file_type=result['file_type'],
                content_preview=result['content_preview'],
                total_characters=result['total_characters'],
                message=result.get('message', 'Document processed successfully')
            )
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except:
                    pass
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload failed: {str(e)}")


@router.get("/session/{session_id}", response_model=DocumentList)
async def get_session_documents(session_id: str):
    """
    **List all documents for a session**
    
    Get all uploaded documents associated with this session.
    Use document IDs to ask questions about specific documents.
    """
    try:
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        documents = document_service.list_documents(session_id)
        
        # Convert to DocumentInfo objects
        doc_infos = [
            DocumentInfo(
                id=doc['id'],
                filename=doc['filename'],
                file_type=doc['file_type'],
                uploaded_at=datetime.fromisoformat(doc['uploaded_at']),
                content_length=doc['content_length'],
                is_analyzed=doc.get('is_analyzed', True)
            )
            for doc in documents
        ]
        
        return DocumentList(
            session_id=session_id,
            documents=doc_infos,
            total_documents=len(doc_infos)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", response_model=DocumentQuestionResponse)
async def ask_document_question(request: DocumentQuestion):
    """
    **Ask a question about an uploaded document**
    
    The AI will analyze the document content and answer your question
    based on what's in the document.
    
    **Process:**
    1. AI reads the document content
    2. AI answers your question based on document
    3. Response stored in session history
    4. Analytics logged
    
    **Modes:**
    - normal: Direct answer
    - teaching: Detailed explanation from document
    - guiding: Hints from document content
    """
    try:
        # Validate session
        if not session_service.validate_session(request.session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get document
        document = document_service.get_document(request.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Verify document belongs to this session
        if document['session_id'] != request.session_id:
            raise HTTPException(status_code=403, detail="Document does not belong to this session")
            
        # Truncate content if it's too large to fit in OpenAI context limit (approx 8192 tokens max)
        from ..utils.tokenizer import truncate_context
        # Use roughly 8000 characters as a very safe buffer (approx 1500-2000 tokens)
        # to leave plenty of room for chat history and the AI's response!
        safe_content = document['content'][:8000] 
        
        # Build system prompt with document context
        system_prompt = f"""You are an AI assistant analyzing a document.

DOCUMENT CONTENT:
---
{safe_content}
---

INSTRUCTIONS:
- Answer questions based ONLY on the document content above
- If the answer is not in the document, say so clearly
- Mode: {request.mode}
- Be accurate and reference specific parts of the document
"""
        
        # Get conversation context
        context_messages = session_service.get_session_context(
            request.session_id,
            max_messages=settings.MAX_CONTEXT_MESSAGES
        )
        
        # Get AI response
        import time
        start_time = time.time()
        ai_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=context_messages,
            user_message=request.question
        )
        response_time = time.time() - start_time
        
        # Store messages in session
        session_service.add_message_to_session(
            request.session_id, "user", 
            f"[ABOUT DOCUMENT: {document['filename']}] {request.question}"
        )
        session_service.add_message_to_session(
            request.session_id, "assistant", ai_response
        )
        
        # Log analytics
        query_id = str(uuid.uuid4())
        analytics_service.log_query(
            query_id=query_id,
            session_id=request.session_id,
            message=f"[DOC: {document['filename']}] {request.question}",
            mode=f"document_qa_{request.mode}",
            response_time=response_time
        )
        
        return DocumentQuestionResponse(
            session_id=request.session_id,
            document_id=request.document_id,
            question=request.question,
            answer=ai_response,
            mode=request.mode,
            timestamp=datetime.now(),
            document_referenced=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document Q&A failed: {str(e)}")


@router.get("/{document_id}")
async def get_document_info(document_id: str):
    """
    **Get detailed information about a document**
    
    Returns document metadata and full content.
    """
    try:
        document = document_service.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "id": document['id'],
            "filename": document['filename'],
            "file_type": document['file_type'],
            "session_id": document['session_id'],
            "uploaded_at": document['uploaded_at'],
            "content_length": document['content_length'],
            "content": document['content'],
            "is_analyzed": document['is_analyzed']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    **Delete an uploaded document**
    
    Removes the document from the system.
    """
    try:
        success = document_service.delete_document(document_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "status": "success",
            "message": "Document deleted successfully",
            "document_id": document_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}/all")
async def delete_session_documents(session_id: str):
    """
    **Delete all documents for a session**
    
    Cleans up all documents associated with this session.
    """
    try:
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        docs = document_service.list_documents(session_id)
        count = 0
        for doc in docs:
            if document_service.delete_document(doc['id']):
                count += 1
        
        return {
            "status": "success",
            "message": f"Deleted {count} document(s)",
            "session_id": session_id,
            "deleted_count": count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
