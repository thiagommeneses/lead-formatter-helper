
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  Filter, 
  Phone, 
  CheckCircle, 
  X, 
  ArrowDown,
  Plus
} from "lucide-react";
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
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [visibleData, setVisibleData] = useState<Lead[]>([]);
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
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(5);
  
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
    setShowUploadArea(false);
    toast.success("CSV carregado com sucesso!");
  };

  useEffect(() => {
    if (filterApplied) {
      applyFilters();
      setFilterApplied(false);
    }
  }, [filterApplied]);

  useEffect(() => {
    // When display data changes, update the visible data
    updateVisibleData();
  }, [displayData, visibleItemsCount]);

  const updateVisibleData = () => {
    if (displayData.length <= 5) {
      setVisibleData(displayData);
      setShowLoadMore(false);
    } else {
      setVisibleData(displayData.slice(0, visibleItemsCount));
      setShowLoadMore(visibleItemsCount < displayData.length && visibleItemsCount < 15);
    }
    
    // If we need pagination (more than 15 items)
    if (displayData.length > 15) {
      const result = paginateData(displayData.slice(15), currentPage, 10);
      setTotalPages(result.totalPages);
    } else {
      setTotalPages(1);
    }
  };

  const loadMoreItems = () => {
    const newCount = Math.min(visibleItemsCount + 5, 15);
    setVisibleItemsCount(newCount);
    // Check if we need to show the load more button
    setShowLoadMore(newCount < displayData.length && newCount < 15);
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
          // Get phone from Celular or Telefone fields
          let phoneNumber = row['Celular'] || row['Telefone'];
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
              // If Celular is empty, use Telefone field
              if (!row['Celular'] || row['Celular'].trim() === '') {
                row['Celular'] = formatPhoneNumber(phoneNumber);
                row['Telefone'] = ''; // Clean up secondary phone field
              } else {
                row['Celular'] = formatPhoneNumber(row['Celular']);
              }
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
    setVisibleItemsCount(5); // Reset to initial 5 items
    setCurrentPage(1); // Reset to first page when filters change
    setIsLoading(false);
    
    toast.success("Filtros aplicados com sucesso!");
  };

  const resetData = () => {
    setData([]);
    setDisplayData([]);
    setVisibleData([]);
    setIsCSVLoaded(false);
    setShowUploadArea(true);
    setFilterApplied(false);
    setCurrentPage(1);
    setVisibleItemsCount(5);
    setShowFilters(false);
    toast.success("Dados limpos com sucesso!");
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
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Formatador de Leads</h1>
          <p className="mt-2 text-gray-600">
            Carregue seu CSV, aplique filtros e exporte números de celular formatados
          </p>
        </div>

        {isCSVLoaded && !isLoading && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 rounded-md mb-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center"
                >
                  <Filter className="mr-1 h-4 w-4" />
                  Filtros
                  {showFilters ? <X className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />}
                </Button>
                
                <span className="text-sm text-gray-500">
                  {filterStats.filteredRecords} de {filterStats.totalRecords} registros
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  onClick={handleOmnichatExport} 
                  variant="outline"
                  size="sm"
                  disabled={displayData.length === 0}
                  className="flex items-center"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Exportar Para Omnichat
                </Button>
                
                <Button 
                  onClick={handleZenviaExport}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex items-center"
                  disabled={displayData.length === 0}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Exportar Para Zenvia
                </Button>
                
                <Button 
                  onClick={resetData}
                  variant="destructive"
                  size="sm"
                  className="flex items-center"
                >
                  <X className="mr-1 h-4 w-4" />
                  Fechar Arquivo
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-3 p-3 border border-gray-200 rounded-md">
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
                
                <div className="mt-3">
                  <FilterStatistics 
                    filterStats={filterStats}
                    displayData={displayData}
                    visibleRows={visibleData.length}
                    validPhoneCount={extractPhoneNumbers(displayData).length}
                  />
                </div>
              </div>
            )}
          </div>
        )}

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

        {showUploadArea && (
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
        )}

        {isCSVLoaded && !isLoading && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Dados do CSV ({displayData.length} registros)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDataTable 
                  data={visibleData}
                  showAllColumns={showAllColumns}
                  essentialColumns={["Data da Conversão", "Identificador", "Celular", "Nome"]}
                />
                
                {showLoadMore && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreItems}
                      className="flex items-center"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Carregar mais itens
                    </Button>
                  </div>
                )}
                
                {displayData.length > 15 && (
                  <div className="flex items-center justify-center space-x-2 py-4 mt-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                )}
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
