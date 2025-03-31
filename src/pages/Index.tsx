
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval } from "date-fns";
import { CalendarIcon, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { formatPhoneNumber, isValidBrazilianNumber, extractPhoneNumbers } from '@/utils/phoneUtils';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

interface Lead {
  'Data da Conversão': string;
  'Email': string;
  'Identificador': string;
  'Nome': string;
  'Telefone': string;
  'Celular': string;
  [key: string]: string;
}

// Updated interface to match react-day-picker's DateRange
interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const Index = () => {
  const [data, setData] = useState<Lead[]>([]);
  const [displayData, setDisplayData] = useState<Lead[]>([]);
  const [visibleRows, setVisibleRows] = useState(10);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [formatNumbers, setFormatNumbers] = useState(false);
  const [removeInvalid, setRemoveInvalid] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined });
  const [regexFilter, setRegexFilter] = useState("");
  const [isCSVLoaded, setIsCSVLoaded] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (csvData: Lead[]) => {
    setData(csvData);
    applyFilters(csvData);
    setIsCSVLoaded(true);
    toast.success("CSV carregado com sucesso!");
  };

  useEffect(() => {
    if (filterApplied) {
      applyFilters();
      setFilterApplied(false);
    }
  }, [filterApplied]);

  const applyFilters = (sourceData: Lead[] = data) => {
    let filteredData = [...sourceData];

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filteredData = filteredData.filter(row => {
        if (!row['Data da Conversão']) return false;
        
        try {
          // Convert the conversion date string to a Date object
          // The format is expected to be "YYYY-MM-DD HH:MM:SS TZ"
          const conversionDate = new Date(row['Data da Conversão']);
          
          if (dateRange.from && dateRange.to) {
            // Both start and end dates are set
            return isWithinInterval(conversionDate, { 
              start: dateRange.from, 
              end: dateRange.to 
            });
          } else if (dateRange.from) {
            // Only start date is set
            return conversionDate >= dateRange.from;
          } else if (dateRange.to) {
            // Only end date is set
            return conversionDate <= dateRange.to;
          }
        } catch (error) {
          return false;
        }
        
        return true;
      });
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

  // Handle checkbox changes with immediate filter application
  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setFilterApplied(true);
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
                          handleCheckboxChange(setRemoveDuplicates, checked === true);
                        }}
                      />
                      <Label htmlFor="removeDuplicates">Remover duplicados</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="formatNumbers" 
                        checked={formatNumbers} 
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(setFormatNumbers, checked === true);
                        }}
                      />
                      <Label htmlFor="formatNumbers">Corrigir formato (5562982221100)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="removeInvalid" 
                        checked={removeInvalid} 
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(setRemoveInvalid, checked === true);
                        }}
                      />
                      <Label htmlFor="removeInvalid">Remover números inválidos</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Filtro por Período</h3>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateRange.from && !dateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarRange className="mr-2 h-4 w-4" />
                            {dateRange.from || dateRange.to ? (
                              <>
                                {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Início"}
                                {" - "}
                                {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Fim"}
                              </>
                            ) : (
                              <span>Selecione o período</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{
                              from: dateRange.from,
                              to: dateRange.to
                            }}
                            onSelect={(selectedRange: DayPickerDateRange | undefined) => {
                              setDateRange(selectedRange || { from: undefined });
                              setFilterApplied(true);
                            }}
                            numberOfMonths={2}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {(dateRange.from || dateRange.to) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setDateRange({ from: undefined });
                            setFilterApplied(true);
                          }}
                        >
                          Limpar período
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
                            setFilterApplied(true);
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
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><strong>Total de registros:</strong> {data.length}</p>
                    <p><strong>Registros filtrados:</strong> {displayData.length}</p>
                    <p><strong>Registros exibidos:</strong> {Math.min(visibleRows, displayData.length)}</p>
                  </div>
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
