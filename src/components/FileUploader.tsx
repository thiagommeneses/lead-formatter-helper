
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileUploaded: (data: any[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setIsUploading(true);
        const csvContent = event.target?.result as string;
        
        // Parse CSV
        const rows = csvContent.split('\n');
        const headers = rows[0].split(',');
        
        const data = rows.slice(1).filter(row => row.trim() !== '').map(row => {
          const values = parseCSVRow(row);
          const rowData: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          
          return rowData;
        });
        
        onFileUploaded(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Erro ao processar o arquivo CSV");
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
        toast.error("Por favor, selecione um arquivo CSV válido");
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
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
        <div className="space-y-2">
          <div className="text-4xl text-gray-400">📄</div>
          <p className="text-gray-600">Clique para selecionar ou arraste um arquivo CSV</p>
          {fileName && <p className="text-sm text-gray-500">Arquivo selecionado: {fileName}</p>}
        </div>
      </div>
      <Button 
        onClick={triggerFileInput} 
        className="mt-4"
        disabled={isUploading}
      >
        {isUploading ? "Processando..." : "Carregar arquivo CSV"}
      </Button>
    </div>
  );
};

export default FileUploader;
