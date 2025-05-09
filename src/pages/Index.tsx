import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  Plus,
  X, 
  Trash2,
  MessageSquare,
  FileWarning
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarProvider } from "@/components/ui/sidebar";
import EnhancedDataTable from '@/components/EnhancedDataTable';
import ExportPreview from '@/components/ExportPreview';
import { paginateData, processDataInChunks, filterDataInChunks } from '@/utils/dataLoader';
import FilterSidebar from '@/components/FilterSidebar';
import MobileFilters from '@/components/MobileFilters';
import StatsCard from '@/components/StatsCard';
import { DateRange } from 'react-day-picker';

interface Lead {
  'Data da Conversão': string;
  'Email': string;
  'Identificador': string;
  'Nome': string;
  'Telefone': string;
  'Celular': string;
  [key: string]: string;
}

interface FilterStats {
  totalRecords: number;
  filteredRecords: number;
  invalidNumbers: number;
  duplicateNumbers: number;
  validPhoneNumbers: number;
}

const defaultFilterStats: FilterStats = {
  totalRecords: 0,
  filteredRecords: 0,
  invalidNumbers: 0,
  duplicateNumbers: 0,
  validPhoneNumbers: 0
};

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
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [showAllColumns, setShowAllColumns] = useState(true);
  const [filterStats, setFilterStats] = useState<FilterStats>(defaultFilterStats);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportType, setExportType] = useState<'omnichat' | 'zenvia'>('omnichat');
  const [phonesToExport, setPhonesToExport] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showUploadArea, setShowUploadArea] = useState(true);
  const [visibleItemsCount, setVisibleItemsCount] = useState(5);
  const [showLoadMore, setShowLoadMore] = useState(false);
  
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
    
    const hasPhoneNumbers = csvData.some(row => 
      (row['Celular'] && row['Celular'].trim() !== '') || 
      (row['Telefone'] && row['Telefone'].trim() !== '')
    );
    
    if (!hasPhoneNumbers) {
      toast.warning("O arquivo não contém números de telefone válidos");
    }
    
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
    updateVisibleData();
  }, [displayData, visibleItemsCount, currentPage]);

  const updateVisibleData = () => {
    if (displayData.length <= 5) {
      setVisibleData(displayData);
      setShowLoadMore(false);
    } else {
      const initialData = displayData.slice(0, Math.min(visibleItemsCount, 15));
      
      if (visibleItemsCount >= 15 && displayData.length > 15) {
        // Handle pagination for data beyond the first 15 items
        const paginatedResult = paginateData(displayData.slice(15), currentPage, 10);
        setVisibleData([...initialData, ...paginatedResult.items]); // Fix: changed .data to .items
        setTotalPages(paginatedResult.totalPages);
      } else {
        setVisibleData(initialData);
        setTotalPages(Math.ceil((displayData.length - 15) / 10) + 1);
      }
      
      setShowLoadMore(visibleItemsCount < 15 && visibleItemsCount < displayData.length);
    }
  };

  const loadMoreItems = () => {
    const newCount = Math.min(visibleItemsCount + 5, 15);
    setVisibleItemsCount(newCount);
  };

  const resetFilters = () => {
    setRemoveDuplicates(false);
    setFormatNumbers(false);
    setRemoveInvalid(false);
    setRemoveEmpty(true);
    setDateRange({ from: undefined });
    setRegexFilter("");
    
    toast.success("Filtros reiniciados");
    
    // Apply default filters after reset
    applyFilters(data);
  };

  const applyFilters = async (sourceData: Lead[] = data) => {
    if (sourceData.length === 0) {
      toast.error("Nenhum dado disponível para filtrar");
      return;
    }
    
    setIsLoading(true);
    setProcessingProgress(0);
    
    const stats: FilterStats = {
      totalRecords: sourceData.length,
      filteredRecords: 0,
      invalidNumbers: 0,
      duplicateNumbers: 0,
      validPhoneNumbers: 0
    };

    let filteredData = [...sourceData];
    
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

    if (removeEmpty) {
      filteredData = filteredData.filter(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        return phoneNumber && phoneNumber.trim() !== '';
      });
    }

    if (formatNumbers || removeDuplicates || removeInvalid) {
      const processedNumbers = new Set<string>();
      const invalidCount = { value: 0 };
      const duplicateCount = { value: 0 };
      
      filteredData = await filterDataInChunks<Lead>(
        filteredData,
        (row) => {
          // First check Celular, if empty check Telefone
          let phoneNumber = row['Celular'] && row['Celular'].trim() !== '' 
            ? row['Celular'] 
            : (row['Telefone'] && row['Telefone'].trim() !== '' ? row['Telefone'] : '');
            
          if (!phoneNumber) return true;
          
          const formattedNumber = formatNumbers ? formatPhoneNumber(phoneNumber) : phoneNumber;
          
          if (!isValidBrazilianNumber(formattedNumber)) {
            invalidCount.value++;
            return !removeInvalid;
          }
          
          if (processedNumbers.has(formattedNumber)) {
            duplicateCount.value++;
            return !removeDuplicates;
          }
          
          processedNumbers.add(formattedNumber);
          return true;
        },
        (row) => {
          if (formatNumbers) {
            // Process Celular field
            if (row['Celular'] && row['Celular'].trim() !== '') {
              row['Celular'] = formatPhoneNumber(row['Celular']);
            } 
            // If Celular is empty but Telefone is not, move Telefone to Celular
            else if (row['Telefone'] && row['Telefone'].trim() !== '') {
              row['Celular'] = formatPhoneNumber(row['Telefone']);
              row['Telefone'] = '';
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
    setVisibleItemsCount(5);
    setCurrentPage(1);
    setIsLoading(false);
  };

  const resetData = () => {
    setData([]);
    setDisplayData([]);
    setVisibleData([]);
    setIsCSVLoaded(false);
    setShowUploadArea(true);
    setCurrentPage(1);
    setVisibleItemsCount(5);
    setFilterStats(defaultFilterStats);
    resetFilters();
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

  // Helper function to get first name
  const getFirstName = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'Futuro Aluno UniBF';
    
    const firstName = fullName.trim().split(' ')[0];
    // Capitalize only first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  // Map of phone numbers to names
  const createPhoneToNameMap = () => {
    const phoneToName: Record<string, string> = {};
    
    displayData.forEach(lead => {
      const phone = lead['Celular'] || lead['Telefone'];
      const name = lead['Nome'];
      
      if (phone && phone.trim() !== '') {
        phoneToName[phone] = getFirstName(name);
      }
    });
    
    return phoneToName;
  };

  const handleFinalExport = (selectedNumbers: string[], includeFirstName: boolean) => {
    if (selectedNumbers.length === 0) {
      toast.error("Nenhum número selecionado para exportação");
      return;
    }
    
    const phoneToNameMap = includeFirstName ? createPhoneToNameMap() : {};
    
    if (exportType === 'omnichat') {
      let csvContent = includeFirstName ? "fullNumber,Nome\n" : "fullNumber\n";
      
      selectedNumbers.forEach(number => {
        if (includeFirstName) {
          const name = phoneToNameMap[number] || 'Futuro Aluno UniBF';
          csvContent += `${number},${name}\n`;
        } else {
          csvContent += `${number}\n`;
        }
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'phone_numbers.csv';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`${selectedNumbers.length} números exportados com sucesso!`);
    } else if (exportType === 'zenvia') {
      let csvContent = includeFirstName ? "celular;sms;Nome\n" : "celular;sms\n";
      
      selectedNumbers.forEach(number => {
        if (includeFirstName) {
          const name = phoneToNameMap[number] || 'Futuro Aluno UniBF';
          csvContent += `${number};${smsText};${name}\n`;
        } else {
          csvContent += `${number};${smsText}\n`;
        }
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
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {isCSVLoaded && (
          <FilterSidebar
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
            resetFilters={resetFilters}
            isLoading={isLoading}
          />
        )}
        
        <main className="flex-1 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Formatador de Leads</h1>
              <p className="mt-2 text-gray-600">
                Carregue seu CSV, aplique filtros e exporte números de celular formatados
              </p>
            </div>

            {isCSVLoaded && (
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 rounded-md mb-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MobileFilters
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
                      resetFilters={resetFilters}
                      isLoading={isLoading}
                    />
                    
                    <span className="text-sm text-gray-500">
                      {filterStats.filteredRecords} de {filterStats.totalRecords} registros
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleOmnichatExport}
                      disabled={displayData.length === 0}
                      className="flex items-center"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Exportar Omnichat
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleZenviaExport}
                      disabled={displayData.length === 0}
                      className="flex items-center"
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Exportar Zenvia
                    </Button>
                    
                    <Button 
                      onClick={resetData}
                      variant="destructive"
                      size="sm"
                      className="flex items-center"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Fechar Arquivo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isCSVLoaded && (
              <div className="mb-4">
                <StatsCard filterStats={filterStats} variant="compact" />
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
                <FileWarning className="h-4 w-4" />
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

            {isCSVLoaded && (
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
                    
                    {displayData.length > 15 && visibleItemsCount >= 15 && (
                      <div className="flex items-center justify-center space-x-2 py-4 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          Próxima
                        </Button>
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
              smsText={smsText}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
