
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumberForDisplay } from '@/utils/phoneUtils';
import { PhoneValidationIssue, validateBrazilianPhoneNumber, getValidationColor } from '@/utils/phoneValidation';

interface EnhancedDataTableProps {
  data: any[];
  showAllColumns?: boolean;
  essentialColumns?: string[];
  emptyMessage?: string;
}

const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({ 
  data,
  showAllColumns = true,
  essentialColumns = ["Data da Conversão", "Identificador", "Celular"],
  emptyMessage = "Nenhum dado disponível"
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-gray-500">{emptyMessage}</div>;
  }

  // Get all headers from the first row
  const allHeaders = Object.keys(data[0]);
  
  // Determine which headers to display
  const headers = showAllColumns ? allHeaders : essentialColumns.filter(col => allHeaders.includes(col));

  // Enhanced cell renderer for phone numbers
  const renderPhoneCell = (value: string, row: any, fieldName: string) => {
    if (!value) {
      // If the Celular field is empty but Telefone is not, use Telefone
      if (fieldName === 'Celular' && row['Telefone'] && row['Telefone'].trim() !== '') {
        return renderPhoneCell(row['Telefone'], row, 'Telefone');
      }
      return <span className="text-gray-400">-</span>;
    }
    
    const issue = validateBrazilianPhoneNumber(value);
    const displayValue = formatPhoneNumberForDisplay(value);
    const textColorClass = getValidationColor(issue);
    
    if (issue === PhoneValidationIssue.NONE) {
      return (
        <div className="flex items-center">
          <span className={textColorClass}>{displayValue}</span>
          <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 text-xs">
            Válido
          </Badge>
        </div>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <span className={textColorClass}>{displayValue}</span>
              <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 text-xs">
                Inválido
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Problema: {issue}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="overflow-x-auto bg-white rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index} className="whitespace-nowrap">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((header, colIndex) => (
                <TableCell key={colIndex} className="max-w-xs truncate">
                  {(header === 'Celular' || header === 'Telefone') 
                    ? renderPhoneCell(row[header], row, header)
                    : row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EnhancedDataTable;
