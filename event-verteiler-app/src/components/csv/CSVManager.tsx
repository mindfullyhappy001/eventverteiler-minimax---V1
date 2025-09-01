import React, { useState, useRef } from 'react'
import { useEvents } from '@/contexts/EventContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react'

interface CSVManagerProps {
  onClose?: () => void
}

interface ImportResult {
  success: boolean
  importResults?: any[]
  summary?: {
    totalProcessed: number
    successful: number
    failed: number
    validationErrors: number
  }
  errors?: string[]
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  validEvents: number
  totalRows: number
  preview: any[]
}

export function CSVManager({ onClose }: CSVManagerProps) {
  const { 
    exportEventsToCSV, 
    importEventsFromCSV, 
    getCSVTemplate, 
    validateCSV 
  } = useEvents()
  
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContent, setCsvContent] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [currentStep, setCurrentStep] = useState<'select' | 'validate' | 'import' | 'result'>('select')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      await exportEventsToCSV()
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGetTemplate = async () => {
    try {
      await getCSVTemplate()
    } catch (error) {
      console.error('Template error:', error)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      readFile(file)
    } else {
      alert('Bitte wählen Sie eine gültige CSV-Datei aus.')
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const files = event.dataTransfer.files
    const file = files[0]
    
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      readFile(file)
    } else {
      alert('Bitte wählen Sie eine gültige CSV-Datei aus.')
    }
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvContent(content)
      setCurrentStep('validate')
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleValidate = async () => {
    if (!csvContent) return
    
    try {
      const result = await validateCSV(csvContent)
      setValidationResult(result)
      
      if (result.isValid) {
        setCurrentStep('import')
      }
    } catch (error) {
      console.error('Validation error:', error)
    }
  }

  const handleImport = async () => {
    if (!csvContent) return
    
    setIsImporting(true)
    
    try {
      const result = await importEventsFromCSV(csvContent)
      setImportResult(result)
      setCurrentStep('result')
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
      setCurrentStep('result')
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setCsvFile(null)
    setCsvContent('')
    setValidationResult(null)
    setImportResult(null)
    setCurrentStep('select')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CSV-Management</h2>
          <p className="text-muted-foreground">
            Importieren und exportieren Sie Events via CSV-Dateien
          </p>
        </div>
        
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Schließen
          </Button>
        )}
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Events exportieren
          </CardTitle>
          <CardDescription>
            Laden Sie alle Ihre Events als CSV-Datei herunter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Events exportieren
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGetTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV-Vorlage herunterladen
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-2">
              <Info className="h-4 w-4" />
              Hinweis zum Export
            </div>
            <p className="text-blue-700 text-sm">
              Die exportierte CSV-Datei enthält alle Event-Daten und kann zur Sicherung oder 
              zum Import in andere Systeme verwendet werden.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Events importieren
          </CardTitle>
          <CardDescription>
            Laden Sie Events aus einer CSV-Datei hoch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="flex items-center mb-6">
            {['select', 'validate', 'import', 'result'].map((step, index) => {
              const stepLabels = {
                select: 'Datei auswählen',
                validate: 'Validieren',
                import: 'Importieren',
                result: 'Ergebnis'
              }
              
              const isActive = currentStep === step
              const isCompleted = ['select', 'validate', 'import', 'result'].indexOf(currentStep) > index
              
              return (
                <React.Fragment key={step}>
                  <div className={`flex items-center ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      isActive ? 'border-blue-600 bg-blue-50' : 
                      isCompleted ? 'border-green-600 bg-green-50' : 
                      'border-gray-300'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium">{stepLabels[step as keyof typeof stepLabels]}</span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className={`h-4 w-4 mx-4 ${
                      isCompleted ? 'text-green-600' : 'text-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Step Content */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              {/* File Upload */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isDragging ? 'Datei hier ablegen...' : 'CSV-Datei auswählen oder hierhin ziehen'}
                </p>
                <p className="text-sm text-gray-600">
                  Unterstützte Dateiformate: .csv (max. 10MB)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {/* File Info */}
              {csvFile && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{csvFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetImport}>
                        Abbrechen
                      </Button>
                      <Button onClick={handleValidate}>
                        Validieren
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'validate' && validationResult && (
            <div className="space-y-4">
              {/* Validation Summary */}
              <div className={`p-4 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`flex items-center gap-2 font-medium ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  {validationResult.isValid 
                    ? 'Validierung erfolgreich' 
                    : 'Validierung fehlgeschlagen'
                  }
                </div>
                
                <div className="mt-2 text-sm">
                  <p>Gesamte Zeilen: {validationResult.totalRows}</p>
                  <p>Gültige Events: {validationResult.validEvents}</p>
                  {validationResult.errors.length > 0 && (
                    <p>Fehler: {validationResult.errors.length}</p>
                  )}
                </div>
              </div>
              
              {/* Validation Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Validierungsfehler
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                    {validationResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Preview */}
              {validationResult.preview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Vorschau (erste 5 Events)</h4>
                  <div className="border rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Titel</th>
                            <th className="px-3 py-2 text-left">Datum</th>
                            <th className="px-3 py-2 text-left">Ort</th>
                            <th className="px-3 py-2 text-left">Typ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.preview.slice(0, 5).map((event, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{event.titel || '-'}</td>
                              <td className="px-3 py-2">{event.datum || '-'}</td>
                              <td className="px-3 py-2">{event.ort || '-'}</td>
                              <td className="px-3 py-2">{event.event_typ || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetImport}>
                  Neue Datei wählen
                </Button>
                
                {validationResult.isValid && (
                  <Button 
                    onClick={() => setCurrentStep('import')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Weiter zum Import
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 'import' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <p className="text-lg font-medium mb-2">Bereit zum Importieren</p>
                <p className="text-muted-foreground mb-6">
                  {validationResult?.validEvents} gültige Events werden importiert
                </p>
                
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep('validate')}>
                    Zurück zur Validierung
                  </Button>
                  
                  <Button 
                    onClick={handleImport}
                    disabled={isImporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importiere...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Events importieren
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'result' && importResult && (
            <div className="space-y-4">
              {/* Import Summary */}
              <div className={`p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`flex items-center gap-2 font-medium mb-2 ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  Import {importResult.success ? 'erfolgreich' : 'fehlgeschlagen'}
                </div>
                
                {importResult.summary && (
                  <div className="text-sm space-y-1">
                    <p>Verarbeitet: {importResult.summary.totalProcessed}</p>
                    <p>Erfolgreich: {importResult.summary.successful}</p>
                    <p>Fehlgeschlagen: {importResult.summary.failed}</p>
                    {importResult.summary.validationErrors > 0 && (
                      <p>Validierungsfehler: {importResult.summary.validationErrors}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Import Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Import-Fehler
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-center">
                <Button onClick={resetImport}>
                  Neuen Import starten
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}