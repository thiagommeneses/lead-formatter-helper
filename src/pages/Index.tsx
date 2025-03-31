
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { formatPhoneNumber, isValidBrazilianNumber, extractPhoneNumbers } from '@/utils/phoneUtils';

interface Lead {
  'Data da Conversão': string;
  'Email': string;
  'Identificador': string;
  'Nome': string;
  'Telefone': string;
  'Celular': string;
  [key: string]: string;
}

const Index = () => {
  const [data, setData] = useState<Lead[]>([]);
  const [displayData, setDisplayData] = useState<Lead[]>([]);
  const [visibleRows, setVisibleRows] = useState(10);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [formatNumbers, setFormatNumbers] = useState(false);
  const [removeInvalid, setRemoveInvalid] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [regexFilter, setRegexFilter] = useState("");
  const [isCSVLoaded, setIsCSVLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (csvData: Lead[]) => {
    setData(csvData);
    applyFilters(csvData);
    setIsCSVLoaded(true);
    toast.success("CSV carregado com sucesso!");
  };

  const applyFilters = (sourceData: Lead[] = data) => {
    let filteredData = [...sourceData];

    // Apply date filter
    if (dateFilter) {
      const dateString = format(dateFilter, 'yyyy-MM-dd');
      filteredData = filteredData.filter(row => 
        row['Data da Conversão'] && row['Data da Conversão'].startsWith(dateString)
      );
    }

    // Apply regex filter to Identificador
    if (regexFilter.trim()) {
      try {
        const regexPattern = new RegExp(regexFilter, 'i');
        filteredData = filteredData.filter(row => 
          regexPattern.test(row['Identificador'] || '')
        );
      } catch (error) {
        toast.error("Expressão regular inválida");
      }
    }

    // Process phone numbers
    if (formatNumbers || removeDuplicates || removeInvalid) {
      const processedNumbers = new Set<string>();
      
      filteredData = filteredData.filter(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        if (!phoneNumber) return true;
        
        const formattedNumber = formatNumbers ? formatPhoneNumber(phoneNumber) : phoneNumber;
        row['Celular'] = formattedNumber;
        
        // Check if valid
        if (removeInvalid && !isValidBrazilianNumber(formattedNumber)) {
          return false;
        }
        
        // Check for duplicates
        if (removeDuplicates) {
          if (processedNumbers.has(formattedNumber)) {
            return false;
          }
          processedNumbers.add(formattedNumber);
        }
        
        return true;
      });
    }

    setDisplayData(filteredData);
    setVisibleRows(10);
  };

  const loadMoreRows = () => {
    setVisibleRows(prev => prev + 10);
  };

  const exportPhoneNumbers = () => {
    // Get all unique, valid phone numbers
    const phoneNumbers = extractPhoneNumbers(displayData);
    
    // Create CSV content
    const csvContent = "fullNumber\n" + phoneNumbers.join("\n");
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=ansi' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phone_numbers.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${phoneNumbers.length} números exportados com sucesso!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Formatador de Leads</h1>
          <p className="mt-2 text-gray-600">
            Carregue seu CSV, aplique filtros e exporte números de celular formatados
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Carregar Arquivo CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onFileUploaded={handleFileUpload} />
          </CardContent>
        </Card>

        {isCSVLoaded && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Opções e Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Processamento de Números</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="removeDuplicates" 
                        checked={removeDuplicates} 
                        onCheckedChange={(checked) => {
                          setRemoveDuplicates(checked === true);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      />
                      <Label htmlFor="removeDuplicates">Remover duplicados</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="formatNumbers" 
                        checked={formatNumbers} 
                        onCheckedChange={(checked) => {
                          setFormatNumbers(checked === true);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      />
                      <Label htmlFor="formatNumbers">Corrigir formato (5562982221100)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="removeInvalid" 
                        checked={removeInvalid} 
                        onCheckedChange={(checked) => {
                          setRemoveInvalid(checked === true);
                          setTimeout(() => applyFilters(), 0);
                        }}
                      />
                      <Label htmlFor="removeInvalid">Remover números inválidos</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Filtro por Data</h3>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateFilter && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter ? format(dateFilter, "dd/MM/yyyy") : <span>Selecione a data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFilter}
                            onSelect={(date) => {
                              setDateFilter(date);
                              setTimeout(() => applyFilters(), 0);
                            }}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {dateFilter && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setDateFilter(undefined);
                            setTimeout(() => applyFilters(), 0);
                          }}
                        >
                          Limpar data
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Filtro por Identificador (Regex)</h3>
                    <div>
                      <Input
                        placeholder="Ex: formulario|conversão"
                        value={regexFilter}
                        onChange={(e) => setRegexFilter(e.target.value)}
                        className="mb-2"
                      />
                      <Button 
                        onClick={() => applyFilters()}
                        className="mr-2"
                      >
                        Aplicar Filtro
                      </Button>
                      {regexFilter && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setRegexFilter("");
                            setTimeout(() => applyFilters(), 0);
                          }}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {displayData.length} de {data.length} registros exibidos
                  </p>
                  <Button 
                    onClick={exportPhoneNumbers}
                    variant="default"
                  >
                    Exportar Números
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  data={displayData.slice(0, visibleRows)} 
                />
                
                {visibleRows < displayData.length && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={loadMoreRows}>
                      Carregar mais {Math.min(10, displayData.length - visibleRows)} registros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
