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
import { CalendarIcon, CalendarRange, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { formatPhoneNumber, isValidBrazilianNumber, extractPhoneNumbers } from '@/utils/phoneUtils';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsText, setSmsText] = useState("");
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

    if (dateRange.from || dateRange.to) {
      filteredData = filteredData.filter(row => {
        if (!row['Data da Conversão']) return false;
        
        try {
          const conversionDate = new Date(row['Data da Conversão']);
          
          if (dateRange.from && dateRange.to) {
            return isWithinInterval(conversionDate, { 
              start: dateRange.from, 
              end: dateRange.to 
            });
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
        const regexPattern = new RegExp(regexFilter, 'i');
        filteredData = filteredData.filter(row => 
          regexPattern.test(row['Identificador'] || '')
        );
      } catch (error) {
        toast.error("Expressão regular inválida");
      }
    }

    if (formatNumbers || removeDuplicates || removeInvalid) {
      const processedNumbers = new Set<string>();
      
      filteredData = filteredData.filter(row => {
        const phoneNumber = row['Celular'] || row['Telefone'];
        if (!phoneNumber) return true;
        
        const formattedNumber = formatNumbers ? formatPhoneNumber(phoneNumber) : phoneNumber;
        row['Celular'] = formattedNumber;
        
        if (removeInvalid && !isValidBrazilianNumber(formattedNumber)) {
          return false;
        }
        
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
    // Get all unique, valid phone numbers from the entire filtered dataset
    const phoneNumbers = extractPhoneNumbers(displayData);
    
    const csvContent = "fullNumber\n" + phoneNumbers.join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=ansi' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phone_numbers.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${phoneNumbers.length} números exportados com sucesso!`);
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
    
    // Get all unique, valid phone numbers from the entire filtered dataset
    const phoneNumbers = extractPhoneNumbers(displayData);
    
    let csvContent = "celular;sms\n";
    
    phoneNumbers.forEach(number => {
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
    setSmsText("");
    toast.success(`${phoneNumbers.length} números exportados para formato Zenvia!`);
  };

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
                  <div className="space-x-2">
                    <Button onClick={exportPhoneNumbers} variant="outline">
                      Exportar Para Omnichat
                    </Button>
                    <Button 
                      onClick={() => setShowSmsDialog(true)}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
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
                Exportar {displayData.length > 0 ? `(${extractPhoneNumbers(displayData).length} números)` : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
