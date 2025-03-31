
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, AlertCircle, Phone } from "lucide-react";

interface FilterStats {
  totalRecords: number;
  filteredRecords: number;
  invalidNumbers: number;
  duplicateNumbers: number;
  validPhoneNumbers: number;
}

interface FilterStatisticsProps {
  filterStats: FilterStats;
  displayData: any[];
  visibleRows: number;
  validPhoneCount: number;
}

const FilterStatistics: React.FC<FilterStatisticsProps> = ({ 
  filterStats, 
  displayData, 
  visibleRows,
  validPhoneCount
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="font-medium mb-3 text-gray-700">Estatísticas de Filtro</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de registros</p>
                <p className="text-2xl font-semibold">{filterStats.totalRecords}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Registros filtrados: <span className="font-medium">{filterStats.filteredRecords}</span></p>
              <p className="text-sm text-gray-500">Exibidos: <span className="font-medium">{Math.min(visibleRows, displayData.length)}</span></p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Números válidos</p>
                <p className="text-2xl font-semibold text-green-600">{filterStats.validPhoneNumbers}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Para exportação: <span className="font-medium">{validPhoneCount}</span></p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Números inválidos</p>
                <p className="text-2xl font-semibold text-red-600">{filterStats.invalidNumbers}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Duplicados</p>
                <p className="text-2xl font-semibold text-amber-600">{filterStats.duplicateNumbers}</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilterStatistics;
