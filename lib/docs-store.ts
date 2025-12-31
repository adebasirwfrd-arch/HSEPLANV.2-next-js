// Related Documents Store - CRUD operations with localStorage persistence

export interface RelatedDocument {
    id: string
    name: string
    type: string
    wptsId: string
    size: string
    createdAt: string
    attachment?: {
        id: string
        filename: string
        driveFileId: string
        driveUrl: string
        downloadUrl?: string
        uploadedAt: string
    }
}

const STORAGE_KEY = 'hse-related-docs'

// Document type options
export const documentTypes = [
    { value: 'policy', label: 'Policy' },
    { value: 'manual', label: 'Manual' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'guideline', label: 'Guideline' },
    { value: 'template', label: 'Template' },
    { value: 'report', label: 'Report' },
    { value: 'form', label: 'Form' },
    { value: 'training', label: 'Training Material' },
    { value: 'other', label: 'Other' },
]

// Default sample documents
const defaultDocuments: RelatedDocument[] = [
    {
        id: '1',
        name: 'HSE Policy Manual',
        type: 'manual',
        wptsId: 'WPTS-DOC-001',
        size: '2.4 MB',
        createdAt: '2024-01-15',
    },
    {
        id: '2',
        name: 'Emergency Response Plan',
        type: 'procedure',
        wptsId: 'WPTS-DOC-002',
        size: '1.8 MB',
        createdAt: '2024-02-20',
    },
    {
        id: '3',
        name: 'Risk Assessment Template',
        type: 'template',
        wptsId: 'WPTS-DOC-003',
        size: '450 KB',
        createdAt: '2024-03-10',
    },
    {
        id: '4',
        name: 'Safety Training Materials',
        type: 'training',
        wptsId: 'WPTS-DOC-004',
        size: '15.2 MB',
        createdAt: '2024-04-05',
    },
    {
        id: '5',
        name: 'Incident Report Form',
        type: 'form',
        wptsId: 'WPTS-DOC-005',
        size: '125 KB',
        createdAt: '2024-05-12',
    },
    {
        id: '6',
        name: 'PPE Requirements Guide',
        type: 'guideline',
        wptsId: 'WPTS-DOC-006',
        size: '890 KB',
        createdAt: '2024-06-01',
    },
]

// Load documents from localStorage
export function loadDocuments(): RelatedDocument[] {
    if (typeof window === 'undefined') return defaultDocuments

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Error loading documents:', e)
    }

    // Initialize with defaults
    saveDocuments(defaultDocuments)
    return defaultDocuments
}

// Save documents to localStorage
export function saveDocuments(documents: RelatedDocument[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
}

// Add a new document
export function addDocument(doc: Omit<RelatedDocument, 'id' | 'createdAt'>): RelatedDocument {
    const documents = loadDocuments()
    const newDoc: RelatedDocument = {
        ...doc,
        id: `doc-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
    }
    documents.unshift(newDoc)
    saveDocuments(documents)
    return newDoc
}

// Update an existing document
export function updateDocument(id: string, updates: Partial<RelatedDocument>): RelatedDocument | null {
    const documents = loadDocuments()
    const index = documents.findIndex(d => d.id === id)
    if (index === -1) return null

    documents[index] = { ...documents[index], ...updates }
    saveDocuments(documents)
    return documents[index]
}

// Delete a document
export function deleteDocument(id: string): boolean {
    const documents = loadDocuments()
    const filtered = documents.filter(d => d.id !== id)
    if (filtered.length === documents.length) return false
    saveDocuments(filtered)
    return true
}

// Search documents
export function searchDocuments(query: string): RelatedDocument[] {
    const documents = loadDocuments()
    if (!query.trim()) return documents

    const q = query.toLowerCase()
    return documents.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.wptsId.toLowerCase().includes(q)
    )
}

// Get type label
export function getTypeLabel(typeValue: string): string {
    const found = documentTypes.find(t => t.value === typeValue)
    return found ? found.label : typeValue.toUpperCase()
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
