
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange as DayPickerDateRange } from 'react-day-picker';

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
  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setFilterApplied(true);
  };

  return (
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
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="removeEmpty" 
            checked={removeEmpty} 
            onCheckedChange={(checked) => {
              handleCheckboxChange(setRemoveEmpty, checked === true);
            }}
          />
          <Label htmlFor="removeEmpty">Remover números em branco</Label>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox 
            id="showAllColumns" 
            checked={showAllColumns} 
            onCheckedChange={(checked) => {
              setShowAllColumns(checked === true);
            }}
          />
          <Label htmlFor="showAllColumns">Exibir todas as colunas</Label>
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
  );
};

export default FilterOptions;
