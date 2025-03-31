import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Download, FileSpreadsheet, AlertTriangle, Filter, Phone, CheckCircle } from "lucide-react";
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import { formatPhoneNumber, isValidBrazilianNumber, extractPhoneNumbers } from '@/utils/phoneUtils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import FilterOptions from '@/components/FilterOptions';
import FilterStatistics from '@/components/FilterStatistics';
import EnhancedDataTable from '@/components/EnhancedDataTable';
import ExportPreview from '@/components/ExportPreview';
import { paginateData, processDataInChunks, filterDataInChunks } from '@/utils/dataLoader';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Lead {
  'Data da Conversão': string;
  'Email': string;
  'Identificador': string;
  'Nome': string;
  'Telefone': string;
  'Celular': string;
  [key: string]: string;
}

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface FilterStats {
  totalRecords: number;
  filteredRecords: number;
  invalidNumbers: number;
  duplicateNumbers: number;
  validPhoneNumbers: number;
}

const Index = () => {
  const [data, setData] = useState<Lead[]>([]);
  const [displayData, setDisplayData] = useState<Lead[]>([]);
  const [paginatedData, setPaginatedData] = useState<Lead[]>([]);
  const [visibleRows, setVisibleRows] = useState(10);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [formatNumbers, setFormatNumbers] = useState(false);
  const [removeInvalid, setRemoveInvalid] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined });
  const [regexFilter, setRegexFilter] = useState("");
  const [isCSVLoaded, setIsCSVLoaded] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [showAllColumns, setShowAllColumns] = useState(true);
  const [filterStats, setFilterStats] = useState<FilterStats>({
    totalRecords: 0,
    filteredRecords: 0,
    invalidNumbers: 0,
    duplicateNumbers: 0,
    validPhoneNumbers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportType, setExportType] = useState<'omnichat' | 'zenvia'>('omnichat');
  const [phonesToExport, setPhonesToExport] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const pageSize = 50; // Page size for pagination
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (csvData: Lead[]) => {
    setIsLoading(true);
    setProcessingProgress(0);
    
    if (csvData.length === 0) {
      toast.error("O arquivo CSV não contém dados válidos");
      setIsLoading(false);
      return;
    }
    
    toast.info(`Carregando ${csvData.length} registros...`);
    setData(csvData);
    
    // Check if the file contains phone numbers
    const hasPhoneNumbers = csvData.some(row => 
      (row['Celular'] && row['Celular'].trim() !== '') || 
      (row['Telefone'] && row['Telefone'].trim() !== '')
    );
    
    if (!hasPhoneNumbers) {
      toast.warning("O arquivo não contém números de telefone válidos");
    }
    
    // Process in chunks to avoid UI freezing with large data
    await processDataInChunks<Lead, void>(
      csvData,
      () => {},
      1000,
      (processed, total) => {
        const progress = Math.round((processed/total)*100);
        setProcessingProgress(progress);
      }
    );
    
    await applyFilters(csvData);
    setIsCSVLoaded(true);
    setIsLoading(false);
    toast.success("CSV carregado com sucesso!");
  };

  useEffect(() => {
    if (filterApplied) {
      applyFilters();
      setFilterApplied(false);
    }
  }, [filterApplied]);

  useEffect(() => {
    // When display data changes, update pagination
    updatePagination(currentPage);
  }, [displayData, currentPage]);

  const updatePagination = (page: number) => {
    const result = paginateData(displayData, page, pageSize);
    setPaginatedData(result.items);
    setTotalPages(result.totalPages);
  };

  const applyFilters = async (sourceData: Lead[] = data) => {
    if (sourceData.length === 0) {
      toast.error("Nenhum dado disponível para filtrar");
      return;
    }
    
    setIsLoading(true);
    setProcessingProgress(0);
    toast.info("Aplicando filtros...");
    
    const stats: FilterStats = {
      totalRecords: sourceData.length,
      filteredRecords: 0,
      invalidNumbers: 0,
      duplicateNumbers: 0,
      validPhoneNumbers: 0
    };

    // Apply basic filters
    let filteredData = [...sourceData];
    
    // Date range filter
    if (dateRange.from || dateRange.to) {
      filteredData = filteredData.filter(row => {
        if (!row['Data da Conversão']) return false;
        
        try {
          const conversionDate = new Date(row['Data da Conversão']);
          
          if (dateRange.from && dateRange.to) {
            return conversionDate >= dateRange.from && conversionDate <= dateRange.to;
          } else if (dateRange.from) {
            return conversionDate >= dateRange.from;
          } else if (dateRange.to) {
            return conversionDate <= dateRange.to;
          }
        } catch (error) {
          return false;
        }
        
        return true;
      });
    }

    // Regex filter
    if (regexFilter.trim()) {
      try {
        const regexPatterns = regexFilter.split('|').map(pattern => new RegExp(pattern.trim(), 'i'));
        
        filteredData = filteredData.filter(row => {
          return regexPatterns.some(pattern => pattern.test(row['Identificador'] || ''));
        });
      } catch (error) {
        toast.error("Expressão regular inválida");
      }
    }

    // Remove empty phone numbers
    if (removeEmpty) {
      filteredData = filteredData.filter(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        return phoneNumber && phoneNumber.trim() !== '';
      });
    }

    // For number formatting, duplicates and validation, process in chunks
    if (formatNumbers || removeDuplicates || removeInvalid) {
      const processedNumbers = new Set<string>();
      const invalidCount = { value: 0 };
      const duplicateCount = { value: 0 };
      
      // Create a new filtered dataset with chunked processing
      filteredData = await filterDataInChunks<Lead>(
        filteredData,
        (row) => {
          const phoneNumber = row['Celular'] || row['Telefone'];
          if (!phoneNumber) return true; // Keep rows without phone numbers
          
          // Format the phone number if requested
          const formattedNumber = formatNumbers ? formatPhoneNumber(phoneNumber) : phoneNumber;
          
          // Check for invalid numbers
          if (!isValidBrazilianNumber(formattedNumber)) {
            invalidCount.value++;
            return !removeInvalid; // Remove if removeInvalid is true
          }
          
          // Check for duplicates
          if (processedNumbers.has(formattedNumber)) {
            duplicateCount.value++;
            return !removeDuplicates; // Remove if removeDuplicates is true
          }
          
          // Store the processed number
          processedNumbers.add(formattedNumber);
          return true;
        },
        (row) => {
          // Format the phone number in the row if needed
          if (formatNumbers) {
            const phoneNumber = row['Celular'] || row['Telefone'];
            if (phoneNumber) {
              row['Celular'] = formatPhoneNumber(phoneNumber);
              row['Telefone'] = ''; // Clean up secondary phone field
            }
          }
          return row;
        },
        500,
        (processed, total) => {
          const progress = Math.round((processed/total)*100);
          setProcessingProgress(progress);
        }
      );

      stats.invalidNumbers = invalidCount.value;
      stats.duplicateNumbers = duplicateCount.value;
      stats.validPhoneNumbers = processedNumbers.size - invalidCount.value;
    } else {
      // Simple count of valid numbers
      const validNumbers = new Set<string>();
      filteredData.forEach(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        if (phoneNumber && isValidBrazilianNumber(phoneNumber)) {
          validNumbers.add(phoneNumber);
        }
      });
      stats.validPhoneNumbers = validNumbers.size;
    }

    stats.filteredRecords = filteredData.length;
    setFilterStats(stats);
    setDisplayData(filteredData);
    setCurrentPage(1); // Reset to first page when filters change
    setIsLoading(false);
    
    toast.success("Filtros aplicados com sucesso!");
  };

  const handleOmnichatExport = () => {
    setExportType('omnichat');
    const phoneNumbers = extractPhoneNumbers(displayData);
    
    if (phoneNumbers.length === 0) {
      toast.error("Nenhum número válido para exportação");
      return;
    }
    
    setPhonesToExport(phoneNumbers);
    setShowExportPreview(true);
  };

  const handleZenviaExport = () => {
    const phoneNumbers = extractPhoneNumbers(displayData);
    
    if (phoneNumbers.length === 0) {
      toast.error("Nenhum número válido para exportação");
      return;
    }
    
    setShowSmsDialog(true);
  };

  const exportPhoneNumbers = (selectedNumbers: string[]) => {
    if (selectedNumbers.length === 0) {
      toast.error("Nenhum número selecionado para exportação");
      return;
    }
    
    const csvContent = "fullNumber\n" + selectedNumbers.join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phone_numbers.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${selectedNumbers.length} números exportados com sucesso!`);
  };

  const exportForZenvia = () => {
    if (smsText.trim() === "") {
      toast.error("Por favor, insira um texto para o SMS");
      return;
    }
    
    if (smsText.length > 160) {
      toast.error("O texto do SMS não pode exceder 160 caracteres");
      return;
    }
    
    setExportType('zenvia');
    const phoneNumbers = extractPhoneNumbers(displayData);
    setPhonesToExport(phoneNumbers);
    setShowExportPreview(true);
  };

  const handleFinalExport = (selectedNumbers: string[]) => {
    if (selectedNumbers.length === 0) {
      toast.error("Nenhum número selecionado para exportação");
      return;
    }
    
    if (exportType === 'omnichat') {
      exportPhoneNumbers(selectedNumbers);
    } else if (exportType === 'zenvia') {
      let csvContent = "celular;sms\n";
      selectedNumbers.forEach(number => {
        csvContent += `${number};${smsText}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zenvia_export.csv';
      link.click();
      URL.revokeObjectURL(url);
      
      setShowSmsDialog(false);
      toast.success(`${selectedNumbers.length} números exportados para formato Zenvia!`);
    }
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
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Carregar Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onFileUploaded={handleFileUpload} />
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center p-4 mb-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-600 mb-2">Processando dados, por favor aguarde...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{processingProgress}% concluído</p>
          </div>
        )}

        {data.length > 0 && !isCSVLoaded && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao processar o arquivo</AlertTitle>
            <AlertDescription>
              Ocorreu um erro ao processar o arquivo CSV. Por favor, verifique o formato e tente novamente.
            </AlertDescription>
          </Alert>
        )}

        {isCSVLoaded && !isLoading && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Opções e Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterOptions 
                  removeDuplicates={removeDuplicates}
                  setRemoveDuplicates={setRemoveDuplicates}
                  formatNumbers={formatNumbers}
                  setFormatNumbers={setFormatNumbers}
                  removeInvalid={removeInvalid}
                  setRemoveInvalid={setRemoveInvalid}
                  removeEmpty={removeEmpty}
                  setRemoveEmpty={setRemoveEmpty}
                  showAllColumns={showAllColumns}
                  setShowAllColumns={setShowAllColumns}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  regexFilter={regexFilter}
                  setRegexFilter={setRegexFilter}
                  applyFilters={() => applyFilters()}
                  setFilterApplied={setFilterApplied}
                />

                <Separator className="my-6" />

                <FilterStatistics 
                  filterStats={filterStats}
                  displayData={displayData}
                  visibleRows={paginatedData.length}
                  validPhoneCount={extractPhoneNumbers(displayData).length}
                />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <div className="text-sm text-gray-500 space-y-1 text-center sm:text-left">
                    <p>Use as opções acima para filtrar os dados.</p>
                    <p>Os números válidos serão exportados nos formatos escolhidos.</p>
                  </div>
                  <div className="space-x-2 flex flex-wrap justify-center gap-2">
                    <Button 
                      onClick={handleOmnichatExport} 
                      variant="outline"
                      disabled={displayData.length === 0}
                      className="flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Para Omnichat
                    </Button>
                    <Button 
                      onClick={handleZenviaExport}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 flex items-center"
                      disabled={displayData.length === 0}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Exportar Para Zenvia
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Dados do CSV ({displayData.length} registros)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDataTable 
                  data={paginatedData}
                  showAllColumns={showAllColumns}
                  essentialColumns={["Data da Conversão", "Identificador", "Celular", "Nome"]}
                  paginationEnabled={true}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                />
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar para Zenvia</DialogTitle>
              <DialogDescription>
                Digite o texto da mensagem SMS que será enviada. Máximo de 160 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Textarea
                placeholder="Digite aqui o texto do SMS..."
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className="min-h-[120px]"
                maxLength={160}
              />
              <div className="text-right text-sm text-gray-500">
                <span className={smsText.length > 160 ? "text-red-500 font-bold" : ""}>
                  {smsText.length}
                </span>/160 caracteres
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setShowSmsDialog(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={exportForZenvia}
                disabled={smsText.trim() === "" || smsText.length > 160}
                className="bg-green-600 hover:bg-green-700"
              >
                Continuar {displayData.length > 0 ? `(${extractPhoneNumbers(displayData).length} números)` : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ExportPreview 
          open={showExportPreview}
          onOpenChange={setShowExportPreview}
          phoneNumbers={phonesToExport}
          onExport={handleFinalExport}
          exportType={exportType}
        />
      </div>
    </div>
  );
};

export default Index;
