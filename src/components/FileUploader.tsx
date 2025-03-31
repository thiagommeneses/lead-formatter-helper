
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Upload, FileType, AlertCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFileUploaded: (data: any[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    if (!file) return;
    
    setFileName(file.name);
    setError(null);
    setProgress(0);
    
    // Check file size (warn if > 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Arquivo grande detectado. O processamento pode demorar mais.");
    }
    
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        setProgress(percentLoaded);
      }
    };
    
    reader.onload = (event) => {
      try {
        setIsUploading(true);
        const csvContent = event.target?.result as string;
        
        // Parse CSV
        const rows = csvContent.split('\n');
        
        if (rows.length < 2) {
          throw new Error("O arquivo CSV não contém dados suficientes");
        }
        
        const headers = parseCSVRow(rows[0]);
        
        // Check for required headers
        if (!headers.includes('Celular') && !headers.includes('Telefone')) {
          toast.warning("Aviso: O arquivo não contém colunas 'Celular' ou 'Telefone'");
        }
        
        const data = rows.slice(1).filter(row => row.trim() !== '').map(row => {
          const values = parseCSVRow(row);
          
          // Skip rows with mismatched columns
          if (values.length !== headers.length) {
            return null;
          }
          
          const rowData: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          return rowData;
        }).filter(Boolean) as Record<string, string>[];
        
        if (data.length === 0) {
          throw new Error("Nenhum dado válido encontrado no arquivo CSV");
        }
        
        toast.success(`${data.length} registros carregados com sucesso!`);
        onFileUploaded(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setError(error instanceof Error ? error.message : "Erro ao processar o arquivo CSV");
        toast.error("Erro ao processar o arquivo CSV");
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    };
    
    reader.onerror = () => {
      setError("Erro ao ler o arquivo");
      toast.error("Erro ao ler o arquivo");
      setIsUploading(false);
      setProgress(0);
    };
    
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError("Por favor, selecione um arquivo CSV válido");
        toast.error("Por favor, selecione um arquivo CSV válido");
        return;
      }
      processFile(file);
    }
  };

  // Helper function to handle commas in quoted values
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    
    result.push(cell);
    return result;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        setError("Por favor, selecione um arquivo CSV válido");
        toast.error("Por favor, selecione um arquivo CSV válido");
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Upload de Arquivo CSV</CardTitle>
        <CardDescription>
          Arraste e solte um arquivo CSV ou clique para selecionar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={dropZoneRef}
          className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="space-y-4">
            {!isUploading ? (
              <>
                <div className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                  {error ? (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <Upload className="h-8 w-8 text-blue-500" />
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">
                    {error ? error : "Clique para selecionar ou arraste um arquivo CSV"}
                  </p>
                  {fileName && <p className="text-sm text-gray-500">Arquivo selecionado: {fileName}</p>}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <FileType className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="text-gray-600">Processando {fileName}...</p>
                <Progress value={progress} className="w-full h-2" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={triggerFileInput} 
          className="w-full"
          disabled={isUploading}
        >
          {isUploading ? "Processando..." : "Carregar arquivo CSV"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
