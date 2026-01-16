"use client"

import { useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { importTransactionsFromCSV } from "@/lib/api/transactions"

interface CSVImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CSVImportDialog({ open, onOpenChange, onSuccess }: CSVImportDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<{ created: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file')
                return
            }
            setFile(selectedFile)
            setError(null)
            setResult(null)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            if (!droppedFile.name.endsWith('.csv')) {
                setError('Please drop a CSV file')
                return
            }
            setFile(droppedFile)
            setError(null)
            setResult(null)
        }
    }

    const handleImport = async () => {
        if (!file) return

        setIsLoading(true)
        setError(null)

        try {
            const content = await file.text()
            const response = await importTransactionsFromCSV(content)
            setResult(response.data)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import CSV')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setError(null)
        setResult(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Import Transactions from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with your bank transactions. The file should have columns for: amount, type, category, date, merchant, description.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText className="w-10 h-10 text-primary" />
                                <p className="font-medium text-foreground">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="w-10 h-10 text-muted-foreground" />
                                <p className="font-medium text-foreground">Drop CSV file here</p>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                            </div>
                        )}
                    </div>

                    {/* CSV Format Guide */}
                    <Card className="bg-secondary/30 border-border">
                        <CardContent className="p-4">
                            <h4 className="font-medium text-sm text-foreground mb-2">Expected CSV Format:</h4>
                            <code className="text-xs text-muted-foreground block overflow-x-auto">
                                amount,type,category,date,merchant,description<br />
                                5000,expense,Food & Dining,2024-01-15,Swiggy,Dinner<br />
                                50000,income,Salary,2024-01-01,Company,Monthly salary
                            </code>
                        </CardContent>
                    </Card>

                    {/* Result */}
                    {result && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p className="text-green-400">
                                Successfully imported {result.created} transactions!
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <p className="text-destructive">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button onClick={handleImport} disabled={!file || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                'Import Transactions'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
