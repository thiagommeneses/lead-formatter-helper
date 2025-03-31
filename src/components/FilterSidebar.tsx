
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger
} from "@/components/ui/sidebar";

interface FilterSidebarProps {
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
  isLoading: boolean;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
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
  isLoading
}) => {
  return (
    <Sidebar variant="inset" collapsible="icon" className="hidden md:block">
      <SidebarHeader>
        <div className="flex justify-between items-center p-2">
          <h3 className="text-lg font-medium">Filtros Avançados</h3>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Processamento de Números</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="removeEmpty" className="cursor-pointer">Remover números vazios</Label>
                <Switch 
                  id="removeEmpty" 
                  checked={removeEmpty}
                  onCheckedChange={setRemoveEmpty}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="removeDuplicates" className="cursor-pointer">Remover duplicados</Label>
                <Switch 
                  id="removeDuplicates" 
                  checked={removeDuplicates}
                  onCheckedChange={setRemoveDuplicates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="formatNumbers" className="cursor-pointer">Corrigir formato (5562982221100)</Label>
                <Switch 
                  id="formatNumbers" 
                  checked={formatNumbers}
                  onCheckedChange={setFormatNumbers}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="removeInvalid" className="cursor-pointer">Remover números inválidos</Label>
                <Switch 
                  id="removeInvalid" 
                  checked={removeInvalid}
                  onCheckedChange={setRemoveInvalid}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showAllColumns" className="cursor-pointer">Mostrar todas as colunas</Label>
                <Switch 
                  id="showAllColumns" 
                  checked={showAllColumns}
                  onCheckedChange={setShowAllColumns}
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Filtro por Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
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
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Filtro por Identificador (Regex)</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <Input 
                placeholder="Ex: formulario|conversão" 
                value={regexFilter}
                onChange={(e) => setRegexFilter(e.target.value)}
              />
              <div className="text-xs text-gray-500">
                Expressões regulares para filtrar por identificador. Use | para separar múltiplos padrões.
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
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
      </SidebarFooter>
    </Sidebar>
  );
};

export default FilterSidebar;
