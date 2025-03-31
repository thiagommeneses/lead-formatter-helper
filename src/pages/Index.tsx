
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";
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
import { paginateData, processDataInChunks } from '@/utils/dataLoader';

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
  const pageSize = 50; // Page size for pagination
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (csvData: Lead[]) => {
    setIsLoading(true);
    setData(csvData);
    
    // Process in chunks to avoid UI freezing with large data
    await processDataInChunks<Lead, void>(
      csvData,
      () => {},
      1000,
      (processed, total) => {
        toast.info(`Processando dados: ${Math.round((processed/total)*100)}%`);
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
    setIsLoading(true);
    let filteredData = [...sourceData];
    const stats: FilterStats = {
      totalRecords: sourceData.length,
      filteredRecords: 0,
      invalidNumbers: 0,
      duplicateNumbers: 0,
      validPhoneNumbers: 0
    };

    // Remove rows with empty phone numbers if the option is selected
    if (removeEmpty) {
      filteredData = filteredData.filter(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        return phoneNumber && phoneNumber.trim() !== '';
      });
    }

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

    if (formatNumbers || removeDuplicates || removeInvalid) {
      const processedNumbers = new Set<string>();
      const invalidCount = { value: 0 };
      const duplicateCount = { value: 0 };
      
      // Process data in chunks for better performance
      filteredData = await processDataInChunks<Lead, Lead>(
        filteredData,
        row => {
          const phoneNumber = row['Celular'] || row['Telefone'];
          if (!phoneNumber) return row;
          
          const formattedNumber = formatNumbers ? formatPhoneNumber(phoneNumber) : phoneNumber;
          row['Celular'] = formattedNumber;
          
          if (!isValidBrazilianNumber(formattedNumber)) {
            invalidCount.value++;
            if (removeInvalid) {
              return null as unknown as Lead;
            }
          }
          
          if (processedNumbers.has(formattedNumber)) {
            duplicateCount.value++;
            if (removeDuplicates) {
              return null as unknown as Lead;
            }
          }
          
          processedNumbers.add(formattedNumber);
          return row;
        },
        500,
        (processed, total) => {
          if (total > 1000) {  // Only show progress for large datasets
            toast.info(`Aplicando filtros: ${Math.round((processed/total)*100)}%`);
          }
        }
      ).then(results => results.filter(Boolean) as Lead[]);

      stats.invalidNumbers = invalidCount.value;
      stats.duplicateNumbers = duplicateCount.value;
      stats.validPhoneNumbers = processedNumbers.size - invalidCount.value;
    }

    stats.filteredRecords = filteredData.length;
    setFilterStats(stats);
    setDisplayData(filteredData);
    setCurrentPage(1); // Reset to first page when filters change
    setIsLoading(false);
  };

  const handleOmnichatExport = () => {
    setExportType('omnichat');
    const phoneNumbers = extractPhoneNumbers(displayData);
    setPhonesToExport(phoneNumbers);
    setShowExportPreview(true);
  };

  const handleZenviaExport = () => {
    setShowSmsDialog(true);
  };

  const exportPhoneNumbers = (selectedNumbers: string[]) => {
    const csvContent = "fullNumber\n" + selectedNumbers.join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=ansi' });
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
    if (exportType === 'omnichat') {
      exportPhoneNumbers(selectedNumbers);
    } else if (exportType === 'zenvia') {
      let csvContent = "celular;sms\n";
      selectedNumbers.forEach(number => {
        csvContent += `${number};${smsText}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=ansi' });
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
            <CardTitle>Carregar Arquivo CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onFileUploaded={handleFileUpload} />
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center p-4">
            <p className="text-blue-600">Processando dados, por favor aguarde...</p>
          </div>
        )}

        {isCSVLoaded && !isLoading && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Opções e Filtros</CardTitle>
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

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Use as opções acima para filtrar os dados.</p>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      onClick={handleOmnichatExport} 
                      variant="outline"
                      disabled={displayData.length === 0}
                    >
                      Exportar Para Omnichat
                    </Button>
                    <Button 
                      onClick={handleZenviaExport}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
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
                <CardTitle>Dados do CSV ({displayData.length} registros)</CardTitle>
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
                {smsText.length}/160 caracteres
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
