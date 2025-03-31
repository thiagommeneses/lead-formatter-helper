
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, AlertCircle, Download, Copy, CheckCircle2, FileDown } from "lucide-react";
import { toast } from 'sonner';

interface EnhancedExportPreviewProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  phoneNumbers: string[];
  onExport: (selectedNumbers: string[]) => void;
  exportType: 'omnichat' | 'zenvia';
  smsText?: string;
}

const EnhancedExportPreview: React.FC<EnhancedExportPreviewProps> = ({
  open,
  onOpenChange,
  phoneNumbers,
  onExport,
  exportType,
  smsText
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt' | 'clipboard'>('csv');
  const [filteredNumbers, setFilteredNumbers] = useState<string[]>([]);

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedNumbers(phoneNumbers);
      setSelectAll(true);
      setSearchTerm('');
      setExportFormat('csv');
    }
  }, [open, phoneNumbers]);

  // Filter numbers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNumbers(phoneNumbers);
      return;
    }
    
    const filtered = phoneNumbers.filter(number => 
      number.includes(searchTerm.trim())
    );
    setFilteredNumbers(filtered);
  }, [searchTerm, phoneNumbers]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNumbers(filteredNumbers);
    } else {
      setSelectedNumbers([]);
    }
  };

  const handleSelectNumber = (number: string, checked: boolean) => {
    if (checked) {
      setSelectedNumbers(prev => [...prev, number]);
    } else {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    }
  };

  const handleCopyToClipboard = () => {
    const content = selectedNumbers.join('\n');
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success('Números copiados para a área de transferência');
      })
      .catch(() => {
        toast.error('Erro ao copiar para a área de transferência');
      });
  };

  const handleExport = () => {
    if (exportFormat === 'clipboard') {
      handleCopyToClipboard();
      onOpenChange(false);
      return;
    }
    
    onExport(selectedNumbers);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {exportType === 'omnichat' ? 'Exportar para Omnichat' : 'Exportar para Zenvia'}
          </DialogTitle>
          <DialogDescription>
            {`${phoneNumbers.length} números encontrados. Selecione os números que deseja exportar.`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Prévia</TabsTrigger>
            <TabsTrigger value="options">Opções de Exportação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar número..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="selectAll" 
                checked={selectAll && filteredNumbers.length > 0}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
              <Label htmlFor="selectAll">Selecionar todos</Label>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedNumbers.length} de {phoneNumbers.length} selecionados
              </span>
            </div>
            
            <ScrollArea className="h-72 border rounded-md">
              <div className="p-4 space-y-2">
                {filteredNumbers.length > 0 ? (
                  filteredNumbers.map((number) => (
                    <div key={number} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`number-${number}`}
                        checked={selectedNumbers.includes(number)}
                        onCheckedChange={(checked) => handleSelectNumber(number, !!checked)}
                      />
                      <Label htmlFor={`number-${number}`} className="font-mono">
                        {number}
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Nenhum número encontrado com esta busca' : 'Nenhum número disponível'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Formato de Exportação</h3>
                <RadioGroup 
                  value={exportFormat} 
                  onValueChange={(value) => setExportFormat(value as 'csv' | 'txt' | 'clipboard')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="format-csv" />
                    <Label htmlFor="format-csv" className="flex items-center">
                      <FileDown className="h-4 w-4 mr-2" />
                      CSV (compatível com Omnichat/Zenvia)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clipboard" id="format-clipboard" />
                    <Label htmlFor="format-clipboard" className="flex items-center">
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar para área de transferência
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {exportType === 'zenvia' && smsText && (
                <div className="border p-3 rounded-md bg-muted/20">
                  <h3 className="text-sm font-medium mb-2">Texto do SMS</h3>
                  <p className="text-sm">{smsText}</p>
                  <div className="text-xs text-right text-muted-foreground mt-1">
                    {smsText.length} caracteres
                  </div>
                </div>
              )}
              
              {selectedNumbers.length > 5000 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Atenção: Muitos números selecionados ({selectedNumbers.length}). 
                    Isto pode causar problemas no processamento.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="sm:order-1"
            >
              Cancelar
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {exportFormat === 'clipboard' ? (
              <Button
                type="button"
                onClick={handleCopyToClipboard}
                disabled={selectedNumbers.length === 0}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" />
                Copiar {selectedNumbers.length} números
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleExport}
                disabled={selectedNumbers.length === 0}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Exportar {selectedNumbers.length} números
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExportPreview;
