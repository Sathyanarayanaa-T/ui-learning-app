"""RAG (Retrieval-Augmented Generation) Service for document context."""

from typing import List, Dict, Optional


class RAGService:
    """Service for document retrieval and context injection into prompts."""
    
    def __init__(self):
        """Initialize RAG service."""
        self.documents: Dict[str, Dict] = {}
        self.embeddings_index: Dict[str, List[float]] = {}
    
    def add_document(self, doc_id: str, content: str, metadata: Dict = None) -> None:
        """
        Add a document to the RAG knowledge base.
        
        Args:
            doc_id: Unique document identifier
            content: Document content/text
            metadata: Optional metadata (title, source, etc.)
        """
        self.documents[doc_id] = {
            "content": content,
            "metadata": metadata or {},
            "chunks": self._chunk_document(content)
        }
    
    def _chunk_document(self, content: str, chunk_size: int = 500) -> List[str]:
        """
        Split document into chunks for better retrieval.
        
        Args:
            content: Document content to chunk
            chunk_size: Approximate size of each chunk in characters
            
        Returns:
            List of document chunks
        """
        words = content.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1
            
            if current_size > chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_size = 0
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def search_documents(self, query: str, top_k: int = 3) -> List[str]:
        """
        Simple keyword search in documents.
        In production, use vector similarity search with embeddings.
        
        Args:
            query: Search query/text
            top_k: Number of top results to return
            
        Returns:
            List of relevant document content
        """
        query_words = set(query.lower().split())
        results = []
        
        for doc_id, doc_data in self.documents.items():
            content_lower = doc_data["content"].lower()
            match_count = sum(1 for word in query_words if word in content_lower)
            
            if match_count > 0:
                results.append((doc_id, doc_data["content"], match_count))
        
        # Sort by relevance (match count)
        results.sort(key=lambda x: x[2], reverse=True)
        
        # Return top K results
        return [result[1] for result in results[:top_k]]
    
    def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """
        Retrieve relevant context from documents for a query.
        Used for RAG-augmented prompts.
        
        Args:
            query: Search query
            top_k: Number of documents to retrieve
            
        Returns:
            Combined context from relevant documents
        """
        relevant_docs = self.search_documents(query, top_k)
        
        if not relevant_docs:
            return ""
        
        # Combine retrieved documents with separator
        context = "\n\n---\n\n".join(relevant_docs)
        return context
    
    def list_documents(self) -> List[Dict]:
        """
        List all documents in the knowledge base.
        
        Returns:
            List of document metadata
        """
        return [
            {
                "doc_id": doc_id,
                "metadata": doc_data["metadata"],
                "chunk_count": len(doc_data["chunks"]),
                "content_length": len(doc_data["content"])
            }
            for doc_id, doc_data in self.documents.items()
        ]
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document from knowledge base.
        
        Args:
            doc_id: Document identifier
            
        Returns:
            True if deleted, False if not found
        """
        if doc_id in self.documents:
            del self.documents[doc_id]
            return True
        return False
    
    def get_document_stats(self) -> Dict:
        """Get statistics about loaded documents."""
        total_content = sum(len(doc["content"]) for doc in self.documents.values())
        total_chunks = sum(len(doc["chunks"]) for doc in self.documents.values())
        
        return {
            "total_documents": len(self.documents),
            "total_characters": total_content,
            "total_chunks": total_chunks,
            "documents": self.list_documents()
        }


# Global RAG service instance
rag_service = RAGService()
