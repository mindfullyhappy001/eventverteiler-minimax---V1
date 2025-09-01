import { supabase } from '@/lib/supabase'

export class CSVService {
  static async exportEvents(): Promise<{
    csvContent: string
    filename: string
    totalEvents: number
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('csv-handler', {
        body: {
          action: 'export'
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error exporting events:', error)
      throw error
    }
  }

  static async importEvents(csvData: string): Promise<{
    success: boolean
    importResults: any[]
    summary: {
      totalProcessed: number
      successful: number
      failed: number
      validationErrors: number
    }
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('csv-handler', {
        body: {
          action: 'import',
          data: { csvData }
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error importing events:', error)
      throw error
    }
  }

  static async getTemplate(): Promise<{
    csvTemplate: string
    filename: string
    headers: string[]
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('csv-handler', {
        body: {
          action: 'template'
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error getting CSV template:', error)
      throw error
    }
  }

  static async validateCSV(csvData: string): Promise<{
    isValid: boolean
    errors: string[]
    validEvents: number
    totalRows: number
    preview: any[]
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('csv-handler', {
        body: {
          action: 'validate',
          data: { csvData }
        }
      })

      if (error) throw error
      return data.data
    } catch (error) {
      console.error('Error validating CSV:', error)
      throw error
    }
  }

  static downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}