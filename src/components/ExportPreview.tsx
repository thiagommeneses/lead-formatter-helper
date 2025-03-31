
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
import { CheckCircle, X, Download, Search, ArrowDown, ArrowUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhoneNumberForDisplay, getStateFromPhoneNumber } from '@/utils/phoneUtils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<'number' | 'state'>('state');
  const [activeTab, setActiveTab] = useState('preview');
  
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
  
  // Filter numbers based on search term and state filter
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
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'number') {
        return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      } else {
        const stateA = getStateFromPhoneNumber(a) || '';
        const stateB = getStateFromPhoneNumber(b) || '';
        return sortOrder === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      }
    });
    
    setFilteredNumbers(result);
  }, [searchTerm, phoneNumbers, filterByState, sortOrder, sortField]);
  
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
    toast.success(`${selectedNumbers.length} números exportados com sucesso!`);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  const changeSortField = (field: 'number' | 'state') => {
    if (sortField === field) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const selectState = (state: string | null) => {
    setFilterByState(state);
  };
  
  const copyToClipboard = () => {
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos um número para copiar");
      return;
    }
    
    const textToCopy = selectedNumbers.join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success(`${selectedNumbers.length} números copiados para a área de transferência`))
      .catch(() => toast.error("Erro ao copiar para a área de transferência"));
  };
  
  const selectByState = (state: string) => {
    const numbersInState = phoneNumbers.filter(number => 
      getStateFromPhoneNumber(number) === state
    );
    
    setSelectedNumbers(prevSelected => {
      const isAllSelected = numbersInState.every(num => prevSelected.includes(num));
      
      if (isAllSelected) {
        // If all are already selected, deselect them
        return prevSelected.filter(num => !numbersInState.includes(num));
      } else {
        // Add all numbers from this state that aren't already selected
        const newSelection = [...prevSelected];
        numbersInState.forEach(num => {
          if (!newSelection.includes(num)) {
            newSelection.push(num);
          }
        });
        return newSelection;
      }
    });
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
        
        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="preview">Visualização de Dados</TabsTrigger>
            <TabsTrigger value="analytics">Análise por Estado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-4">
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
                  <Label>Filtrar por Estado: </Label>
                  <div className="flex flex-wrap gap-1 mt-1 max-w-[300px]">
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
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox 
                  id="select-all"
                  checked={selectAll} 
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="ml-2 text-sm font-medium">
                  Selecionar Todos
                </label>
              </div>
              <div className="text-sm text-gray-500">
                {selectedNumbers.length} de {phoneNumbers.length} números selecionados
              </div>
            </div>
            
            <div className="overflow-y-auto border rounded-md flex-1 h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Sel.</TableHead>
                    <TableHead 
                      className="w-[200px] cursor-pointer hover:bg-gray-50" 
                      onClick={() => changeSortField('number')}
                    >
                      Número
                      {sortField === 'number' && (
                        sortOrder === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
                      )}
                    </TableHead>
                    <TableHead 
                      className="w-[100px] cursor-pointer hover:bg-gray-50"
                      onClick={() => changeSortField('state')}
                    >
                      Estado
                      {sortField === 'state' && (
                        sortOrder === 'asc' ? <ArrowUp className="inline h-3 w-3 ml-1" /> : <ArrowDown className="inline h-3 w-3 ml-1" />
                      )}
                    </TableHead>
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
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Distribuição por Estado</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(states)
                  .sort((a, b) => b[1] - a[1])
                  .map(([state, count]) => {
                    const percentage = Math.round((count / phoneNumbers.length) * 100);
                    const stateNumbers = phoneNumbers.filter(number => 
                      getStateFromPhoneNumber(number) === state
                    );
                    const allSelected = stateNumbers.every(num => 
                      selectedNumbers.includes(num)
                    );
                    
                    return (
                      <div 
                        key={state} 
                        className={`p-3 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors
                          ${allSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                        onClick={() => selectByState(state)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{state}</span>
                          <Badge>{count} números</Badge>
                        </div>
                        <Progress value={percentage} className="h-2 mb-1" />
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>{percentage}% do total</span>
                          <span>{allSelected ? 'Todos selecionados' : 'Clique para selecionar'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <h4 className="font-medium mb-2">Análise Rápida</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Existem {Object.keys(states).length} estados diferentes nos dados.
                  {Object.entries(states)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([state, count], index) => (
                      <span key={state}>
                        {index === 0 ? ' O estado com mais números é ' : index === 1 ? ', seguido por ' : ' e '}
                        <strong>{state}</strong> ({count})
                      </span>
                    ))}
                  .
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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
        
        <DialogFooter className="mt-4 flex flex-wrap gap-2 justify-between sm:justify-between">
          <div>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="mr-2">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Selecionados
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
          <Button onClick={handleExport} disabled={selectedNumbers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar {selectedNumbers.length} número{selectedNumbers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPreview;
