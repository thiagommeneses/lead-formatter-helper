
import React from 'react';

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
      <h3 className="font-medium mb-2">Estatísticas de Filtro</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p><strong>Total de registros:</strong> {filterStats.totalRecords}</p>
          <p><strong>Registros filtrados:</strong> {filterStats.filteredRecords}</p>
          <p><strong>Registros exibidos:</strong> {Math.min(visibleRows, displayData.length)}</p>
        </div>
        <div>
          <p><strong>Números duplicados:</strong> {filterStats.duplicateNumbers}</p>
          <p><strong>Números inválidos:</strong> {filterStats.invalidNumbers}</p>
          <p><strong>Números válidos:</strong> {filterStats.validPhoneNumbers}</p>
        </div>
        <div>
          <p><strong>Telefones para exportação:</strong> {validPhoneCount}</p>
        </div>
      </div>
    </div>
  );
};

export default FilterStatistics;
