
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps {
  data: any[];
  showAllColumns?: boolean;
  essentialColumns?: string[];
}

const DataTable: React.FC<DataTableProps> = ({ 
  data,
  showAllColumns = true,
  essentialColumns = ["Data da Conversão", "Identificador", "Celular"]
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-gray-500">Nenhum dado disponível</div>;
  }

  // Get all headers from the first row
  const allHeaders = Object.keys(data[0]);
  
  // Determine which headers to display
  const headers = showAllColumns ? allHeaders : essentialColumns.filter(col => allHeaders.includes(col));

  return (
    <div className="overflow-x-auto">
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
                  {row[header]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
