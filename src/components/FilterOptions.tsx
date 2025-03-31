
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { Separator } from "@/components/ui/separator";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface FilterOptionsProps {
  removeDuplicates: boolean;
  setRemoveDuplicates: (value: boolean) => void;
  formatNumbers: boolean;
  setFormatNumbers: (value: boolean) => void;
  removeInvalid: boolean;
  setRemoveInvalid: (value: boolean) => void;
  removeEmpty: boolean;
  setRemoveEmpty: (value: boolean) => void;
  showAllColumns: boolean;
  setShowAllColumns: (value: boolean) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  regexFilter: string;
  setRegexFilter: (value: string) => void;
  applyFilters: () => void;
  setFilterApplied: (value: boolean) => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({
  removeDuplicates,
  setRemoveDuplicates,
  formatNumbers,
  setFormatNumbers,
  removeInvalid,
  setRemoveInvalid,
  removeEmpty,
  setRemoveEmpty,
  showAllColumns,
  setShowAllColumns,
  dateRange,
  setDateRange,
  regexFilter,
  setRegexFilter,
  applyFilters,
  setFilterApplied
}) => {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  
  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setFilterApplied(true);
    updateFilterCount();
  };
  
  const updateFilterCount = () => {
    let count = 0;
    if (removeDuplicates) count++;
    if (formatNumbers) count++;
    if (removeInvalid) count++;
    if (removeEmpty) count++;
    if (dateRange.from || dateRange.to) count++;
    if (regexFilter) count++;
    setFilterCount(count);
  };
  
  React.useEffect(() => {
    updateFilterCount();
  }, [removeDuplicates, formatNumbers, removeInvalid, removeEmpty, dateRange, regexFilter]);

  return (
    <div className="rounded-lg border">
      <Collapsible 
        open={!isFilterCollapsed} 
        onOpenChange={(open) => setIsFilterCollapsed(!open)}
      >
        <CollapsibleTrigger className="flex items-center justify-between p-3 w-full cursor-pointer hover:bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Opções de Filtro</span>
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterCount} filtro{filterCount !== 1 ? 's' : ''} ativo{filterCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm">
            {isFilterCollapsed ? "Expandir" : "Recolher"}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-3">
          <Separator className="mb-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna 1: Processamento de Números */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Processamento de Números</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="removeDuplicates" 
                    checked={removeDuplicates} 
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(setRemoveDuplicates, checked === true);
                    }}
                  />
                  <Label htmlFor="removeDuplicates" className="text-sm">Remover duplicados</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="formatNumbers" 
                    checked={formatNumbers} 
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(setFormatNumbers, checked === true);
                    }}
                  />
                  <Label htmlFor="formatNumbers" className="text-sm">Corrigir formato</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="removeInvalid" 
                    checked={removeInvalid} 
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(setRemoveInvalid, checked === true);
                    }}
                  />
                  <Label htmlFor="removeInvalid" className="text-sm">Remover inválidos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="removeEmpty" 
                    checked={removeEmpty} 
                    onCheckedChange={(checked) => {
                      handleCheckboxChange(setRemoveEmpty, checked === true);
                    }}
                  />
                  <Label htmlFor="removeEmpty" className="text-sm">Remover em branco</Label>
                </div>
              </div>
            </div>
            
            {/* Coluna 2: Opções de Exibição e Filtro por Período */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Opções de Exibição</h3>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="showAllColumns" 
                  checked={showAllColumns} 
                  onCheckedChange={(checked) => {
                    setShowAllColumns(checked === true);
                  }}
                />
                <Label htmlFor="showAllColumns" className="text-sm">Exibir todas as colunas</Label>
              </div>
              
              <h3 className="text-sm font-semibold mb-3">Filtro por Período</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
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
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center mt-2"
                  onClick={() => {
                    setDateRange({ from: undefined });
                    setFilterApplied(true);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar período
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-3">Filtro por Identificador (Regex)</h3>
            <div className="flex space-x-2">
              <Input
                id="regexFilter"
                placeholder="Ex: formulario|conversão"
                value={regexFilter}
                onChange={(e) => setRegexFilter(e.target.value)}
                className="text-sm"
              />
              <Button 
                onClick={() => applyFilters()}
                size="sm"
                className="whitespace-nowrap"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Filtrar
              </Button>
            </div>
            {regexFilter && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center mt-2"
                onClick={() => {
                  setRegexFilter("");
                  setFilterApplied(true);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtro
              </Button>
            )}
            <div className="text-xs text-gray-500 mt-2">
              <p>Use o caractere | para separar termos, ex: "form|site" irá buscar por "form" OU "site"</p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={applyFilters} className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterOptions;
