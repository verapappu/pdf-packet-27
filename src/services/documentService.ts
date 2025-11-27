import { supabase } from '@/lib/supabase'
import type { Document, DocumentType, ProductType } from '@/types'

class DocumentService {
  private async validatePDF(file: File): Promise<{ valid: boolean; error?: string }> {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF document' }
    }

    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' }
    }

    if (file.size < 1024) {
      return { valid: false, error: 'File is too small to be a valid PDF' }
    }

    try {
      const arrayBuffer = await file.slice(0, 5).arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const signature = String.fromCharCode(...bytes)

      if (!signature.startsWith('%PDF')) {
        return { valid: false, error: 'File does not appear to be a valid PDF' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Failed to read file' }
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, description, filename, size, type, product_type')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        filename: doc.filename,
        url: '',
        size: doc.size,
        type: doc.type,
        required: false,
        products: [],
        productType: doc.product_type as ProductType
      }))
    } catch (error) {
      console.error('Error fetching documents:', error)
      return []
    }
  }

  async getDocumentsByProductType(productType: ProductType): Promise<Document[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, description, filename, size, type, product_type')
        .eq('product_type', productType)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        filename: doc.filename,
        url: '',
        size: doc.size,
        type: doc.type,
        required: false,
        products: [],
        productType: doc.product_type as ProductType
      }))
    } catch (error) {
      console.error('Error fetching documents by product type:', error)
      return []
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, description, filename, size, type, product_type')
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        filename: data.filename,
        url: '',
        size: data.size,
        type: data.type,
        required: false,
        products: [],
        productType: data.product_type as ProductType
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      return null
    }
  }

  async uploadDocument(
    file: File,
    productType: ProductType,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const validation = await this.validatePDF(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid PDF file')
    }

    try {
      if (onProgress) onProgress(25)

      const fileBuffer = await file.arrayBuffer()

      if (onProgress) onProgress(50)

      const type = this.detectDocumentType(file.name)
      const name = this.extractDocumentName(file.name, type)

      const { data, error } = await supabase
        .from('documents')
        .insert({
          name,
          description: type + ' Document',
          filename: file.name,
          size: file.size,
          type,
          product_type: productType,
          file_data: Array.from(new Uint8Array(fileBuffer))
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (onProgress) onProgress(100)

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        filename: data.filename,
        url: '',
        size: data.size,
        type: data.type,
        required: false,
        products: [],
        productType: data.product_type as ProductType
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error)
      throw error instanceof Error ? error : new Error('Failed to upload document')
    }
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          name: updates.name,
          description: updates.description,
          type: updates.type,
        })
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating document:', error)
      throw error instanceof Error ? error : new Error('Failed to update document')
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error instanceof Error ? error : new Error('Failed to delete document')
    }
  }

  async exportDocumentAsBase64(id: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('file_data')
        .eq('id', id)
        .maybeSingle()

      if (error || !data?.file_data) {
        return null
      }

      const uint8Array = new Uint8Array(data.file_data)
      let base64String = ''
      for (let i = 0; i < uint8Array.length; i++) {
        base64String += String.fromCharCode(uint8Array[i])
      }
      return btoa(base64String)
    } catch (error) {
      console.error('Error exporting document:', error)
      return null
    }
  }

  async getAllDocumentsWithData(): Promise<Array<Document & { fileData: string }>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const results = []
      for (const doc of data || []) {
        if (doc.file_data) {
          const uint8Array = new Uint8Array(doc.file_data)
          let base64String = ''
          for (let i = 0; i < uint8Array.length; i++) {
            base64String += String.fromCharCode(uint8Array[i])
          }
          const fileData = btoa(base64String)

          results.push({
            id: doc.id,
            name: doc.name,
            description: doc.description,
            filename: doc.filename,
            url: '',
            size: doc.size,
            type: doc.type,
            required: false,
            products: [],
            productType: doc.product_type as ProductType,
            fileData
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error fetching all documents with data:', error)
      return []
    }
  }

  private detectDocumentType(filename: string): DocumentType {
    const lower = filename.toLowerCase()

    if (lower.includes('tds') || lower.includes('technical data')) return 'TDS'
    if (lower.includes('esr') || lower.includes('evaluation report')) return 'ESR'
    if (lower.includes('msds') || lower.includes('safety data')) return 'MSDS'
    if (lower.includes('leed')) return 'LEED'
    if (lower.includes('installation') || lower.includes('install')) return 'Installation'
    if (lower.includes('warranty')) return 'warranty'
    if (lower.includes('acoustic') || lower.includes('esl')) return 'Acoustic'
    if (lower.includes('spec') || lower.includes('3-part')) return 'PartSpec'

    return 'TDS'
  }

  private extractDocumentName(filename: string, type: DocumentType): string {
    let name = filename.replace(/\.pdf$/i, '')

    const typeMap: Record<DocumentType, string> = {
      TDS: 'Technical Data Sheet',
      ESR: 'Evaluation Report',
      MSDS: 'Material Safety Data Sheet',
      LEED: 'LEED Credit Guide',
      Installation: 'Installation Guide',
      warranty: 'Limited Warranty',
      Acoustic: 'Acoustical Performance',
      PartSpec: '3-Part Specifications',
    }

    return typeMap[type] || name
  }

}

export const documentService = new DocumentService()
