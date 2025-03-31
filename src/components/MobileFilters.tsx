
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface MobileFiltersProps {
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
  setDateRange: (value: DateRange) => void;
  regexFilter: string;
  setRegexFilter: (value: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  isLoading: boolean;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
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
  resetFilters,
  isLoading
}) => {
  // Apply filters automatically when filter values change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) applyFilters();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [removeDuplicates, formatNumbers, removeInvalid, removeEmpty, dateRange, regexFilter]);
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filtros Avançados</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium">Processamento de Números</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobileRemoveEmpty" className="cursor-pointer">Remover números vazios</Label>
                <Switch 
                  id="mobileRemoveEmpty" 
                  checked={removeEmpty}
                  onCheckedChange={setRemoveEmpty}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mobileRemoveDuplicates" className="cursor-pointer">Remover duplicados</Label>
                <Switch 
                  id="mobileRemoveDuplicates" 
                  checked={removeDuplicates}
                  onCheckedChange={setRemoveDuplicates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mobileFormatNumbers" className="cursor-pointer">Corrigir formato</Label>
                <Switch 
                  id="mobileFormatNumbers" 
                  checked={formatNumbers}
                  onCheckedChange={setFormatNumbers}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mobileRemoveInvalid" className="cursor-pointer">Remover números inválidos</Label>
                <Switch 
                  id="mobileRemoveInvalid" 
                  checked={removeInvalid}
                  onCheckedChange={setRemoveInvalid}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mobileShowAllColumns" className="cursor-pointer">Mostrar todas as colunas</Label>
                <Switch 
                  id="mobileShowAllColumns" 
                  checked={showAllColumns}
                  onCheckedChange={setShowAllColumns}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Filtro por Data</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecione um período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
            
            {dateRange.from && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setDateRange({ from: undefined })}
              >
                <X className="h-4 w-4" />
                Limpar data
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Filtro por Identificador (Regex)</h3>
            <Input 
              placeholder="Ex: formulario|conversão" 
              value={regexFilter}
              onChange={(e) => setRegexFilter(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Expressões regulares para filtrar por identificador. Use | para separar múltiplos padrões.
            </div>
            
            {regexFilter && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setRegexFilter("")}
              >
                <X className="h-4 w-4" />
                Limpar regex
              </Button>
            )}
          </div>
        </div>
        <DrawerFooter className="space-y-2">
          <Button 
            onClick={resetFilters} 
            variant="outline"
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Limpar Todos os Filtros
          </Button>
          
          <Button 
            onClick={applyFilters} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              'Aplicar Filtros'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFilters;
