
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPhoneNumberForDisplay } from '@/utils/phoneUtils';

interface ExportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumbers: string[];
  onExport: (numbers: string[]) => void;
  exportType: 'omnichat' | 'zenvia';
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ 
  open, 
  onOpenChange, 
  phoneNumbers, 
  onExport,
  exportType
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set(phoneNumbers));
  const [selectAll, setSelectAll] = useState(true);

  // Handle select all change
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNumbers(new Set(phoneNumbers));
    } else {
      setSelectedNumbers(new Set());
    }
  };

  // Handle individual number selection
  const handleNumberSelect = (number: string, checked: boolean) => {
    const newSelectedNumbers = new Set(selectedNumbers);
    
    if (checked) {
      newSelectedNumbers.add(number);
    } else {
      newSelectedNumbers.delete(number);
    }
    
    setSelectedNumbers(newSelectedNumbers);
    setSelectAll(newSelectedNumbers.size === phoneNumbers.length);
  };

  // Handle export
  const handleExport = () => {
    onExport(Array.from(selectedNumbers));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Exportação</DialogTitle>
          <DialogDescription>
            {exportType === 'omnichat' 
              ? 'Selecione os números para exportar para o Omnichat'
              : 'Selecione os números para exportar com a mensagem SMS'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-2">
          <Checkbox 
            id="selectAll" 
            checked={selectAll}
            onCheckedChange={(checked) => handleSelectAllChange(checked === true)}
          />
          <Label htmlFor="selectAll">Selecionar todos ({phoneNumbers.length})</Label>
          <span className="text-sm text-gray-500 ml-auto">
            {selectedNumbers.size} números selecionados
          </span>
        </div>
        
        <ScrollArea className="h-[300px] rounded border p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Formato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((phoneNumber, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedNumbers.has(phoneNumber)}
                      onCheckedChange={(checked) => handleNumberSelect(phoneNumber, checked === true)}
                    />
                  </TableCell>
                  <TableCell>{phoneNumber}</TableCell>
                  <TableCell>{formatPhoneNumberForDisplay(phoneNumber)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedNumbers.size === 0}
            className={exportType === 'zenvia' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Exportar {selectedNumbers.size} números
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPreview;
