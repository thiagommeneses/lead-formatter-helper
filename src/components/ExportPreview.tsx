
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
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ExportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumbers: string[];
  onExport: (selectedNumbers: string[]) => void;
  exportType: 'omnichat' | 'zenvia';
  smsText?: string;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  open,
  onOpenChange,
  phoneNumbers,
  onExport,
  exportType,
  smsText
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'clipboard'>('csv');
  
  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setExportFormat('csv');
    }
  }, [open]);

  const handleCopyToClipboard = () => {
    const content = phoneNumbers.join('\n');
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success(`${phoneNumbers.length} números copiados para a área de transferência`);
        onOpenChange(false);
      })
      .catch(() => {
        toast.error('Erro ao copiar para a área de transferência');
      });
  };

  const handleExport = () => {
    if (exportFormat === 'clipboard') {
      handleCopyToClipboard();
      return;
    }
    
    onExport(phoneNumbers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {exportType === 'omnichat' ? 'Exportar para Omnichat' : 'Exportar para Zenvia'}
          </DialogTitle>
          <DialogDescription>
            {`${phoneNumbers.length} números encontrados para exportação.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Formato de Exportação</h3>
            <RadioGroup 
              value={exportFormat} 
              onValueChange={(value) => setExportFormat(value as 'csv' | 'clipboard')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  CSV (compatível com {exportType === 'omnichat' ? 'Omnichat' : 'Zenvia'})
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
          
          {phoneNumbers.length > 5000 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Muitos números selecionados ({phoneNumbers.length}). 
                Isto pode causar problemas no processamento.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          
          {exportFormat === 'clipboard' ? (
            <Button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={phoneNumbers.length === 0}
              className="gap-1.5"
            >
              <Copy className="h-4 w-4" />
              Copiar {phoneNumbers.length} números
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleExport}
              disabled={phoneNumbers.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Exportar {phoneNumbers.length} números
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPreview;
