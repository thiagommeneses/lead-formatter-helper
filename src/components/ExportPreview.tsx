
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, X, Download, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhoneNumberForDisplay, getStateFromPhoneNumber } from '@/utils/phoneUtils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ExportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumbers: string[];
  onExport: (selectedNumbers: string[]) => void;
  exportType: 'omnichat' | 'zenvia';
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  open,
  onOpenChange,
  phoneNumbers,
  onExport,
  exportType
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNumbers, setFilteredNumbers] = useState<string[]>([]);
  const [filterByState, setFilterByState] = useState<string | null>(null);
  const [states, setStates] = useState<{[key: string]: number}>({});
  const [selectAll, setSelectAll] = useState(true);
  
  // Reset selections when the dialog opens or phone numbers change
  useEffect(() => {
    if (open && phoneNumbers.length > 0) {
      setSelectedNumbers([...phoneNumbers]);
      setFilteredNumbers([...phoneNumbers]);
      setSearchTerm('');
      setSelectAll(true);
      analyzeStates();
    }
  }, [open, phoneNumbers]);
  
  const analyzeStates = () => {
    const stateCounter: {[key: string]: number} = {};
    
    phoneNumbers.forEach(number => {
      const state = getStateFromPhoneNumber(number);
      if (state) {
        stateCounter[state] = (stateCounter[state] || 0) + 1;
      }
    });
    
    setStates(stateCounter);
  };
  
  // Filter numbers based on search term
  useEffect(() => {
    let result = [...phoneNumbers];
    
    if (searchTerm) {
      result = result.filter(number => 
        formatPhoneNumberForDisplay(number).includes(searchTerm)
      );
    }
    
    if (filterByState) {
      result = result.filter(number => {
        const state = getStateFromPhoneNumber(number);
        return state === filterByState;
      });
    }
    
    setFilteredNumbers(result);
  }, [searchTerm, phoneNumbers, filterByState]);
  
  const toggleNumber = (number: string) => {
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else {
        return [...prev, number];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers([...filteredNumbers]);
    }
    setSelectAll(!selectAll);
  };
  
  const handleExport = () => {
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos um número para exportar");
      return;
    }
    
    onExport(selectedNumbers);
    onOpenChange(false);
  };
  
  const selectState = (state: string | null) => {
    setFilterByState(state);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Previsão de Exportação</DialogTitle>
          <DialogDescription>
            {exportType === 'omnichat' 
              ? "Confira e selecione os números que deseja exportar para o Omnichat."
              : "Confira e selecione os números que deseja exportar para o Zenvia."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-x-2 flex items-center">
            <div className="text-sm">
              <Label>Estados: </Label>
              <div className="flex flex-wrap gap-1 mt-1 max-w-[250px]">
                {Object.keys(states).length > 0 ? (
                  <>
                    <Badge 
                      variant={filterByState === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => selectState(null)}
                    >
                      Todos
                    </Badge>
                    {Object.entries(states)
                      .sort((a, b) => b[1] - a[1]) // Sort by count descending
                      .map(([state, count]) => (
                        <Badge 
                          key={state}
                          variant={filterByState === state ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => selectState(state)}
                        >
                          {state} ({count})
                        </Badge>
                      ))
                    }
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Não disponível</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-2 rounded flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Checkbox 
              checked={selectAll} 
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="ml-2 text-sm font-medium">
              Selecionar Todos
            </label>
          </div>
          <div className="text-sm text-gray-500">
            {selectedNumbers.length} de {phoneNumbers.length} números selecionados
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sel.</TableHead>
                <TableHead className="w-[200px]">Número</TableHead>
                <TableHead className="w-[100px]">Estado</TableHead>
                <TableHead>Número Completo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNumbers.length > 0 ? (
                filteredNumbers.map((number) => {
                  const isSelected = selectedNumbers.includes(number);
                  const state = getStateFromPhoneNumber(number);
                  
                  return (
                    <TableRow key={number} className={isSelected ? "bg-blue-50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleNumber(number)}
                        />
                      </TableCell>
                      <TableCell>{formatPhoneNumberForDisplay(number)}</TableCell>
                      <TableCell>
                        {state ? (
                          <Badge variant="outline">{state}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{number}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    {searchTerm || filterByState 
                      ? "Nenhum número encontrado com os filtros aplicados." 
                      : "Nenhum número disponível para exportação."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Progresso de seleção</span>
            <span className="text-sm font-medium">
              {Math.round((selectedNumbers.length / phoneNumbers.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={(selectedNumbers.length / Math.max(phoneNumbers.length, 1)) * 100} 
            className="h-2"
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={selectedNumbers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Define the Checkbox component in the same file for simplicity
function Checkbox({ 
  checked, 
  onCheckedChange,
  id 
}: { 
  checked: boolean; 
  onCheckedChange: () => void;
  id?: string;
}) {
  return (
    <div 
      className={`h-5 w-5 border rounded flex items-center justify-center cursor-pointer
        ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
      onClick={onCheckedChange}
      id={id}
    >
      {checked && <CheckCircle className="h-4 w-4 text-white" />}
    </div>
  );
}

export default ExportPreview;
