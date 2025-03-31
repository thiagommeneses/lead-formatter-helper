
import React from 'react';
import { FileCheck, PhoneCall, AlertTriangle, CopyCheck } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface FilterStats {
  totalRecords: number;
  filteredRecords: number;
  invalidNumbers: number;
  duplicateNumbers: number;
  validPhoneNumbers: number;
}

interface StatsCardProps {
  filterStats: FilterStats;
  variant?: 'compact' | 'full';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  filterStats, 
  variant = 'full',
  className = ''
}) => {
  const { totalRecords, filteredRecords, invalidNumbers, duplicateNumbers, validPhoneNumbers } = filterStats;
  
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <Card className="flex-1 min-w-[110px]">
          <CardContent className="p-3 flex flex-col items-center">
            <FileCheck className="h-4 w-4 text-blue-500 mb-1" />
            <div className="text-sm font-semibold">{filteredRecords}</div>
            <div className="text-xs text-muted-foreground">Registros</div>
          </CardContent>
        </Card>
        
        <Card className="flex-1 min-w-[110px]">
          <CardContent className="p-3 flex flex-col items-center">
            <PhoneCall className="h-4 w-4 text-green-500 mb-1" />
            <div className="text-sm font-semibold">{validPhoneNumbers}</div>
            <div className="text-xs text-muted-foreground">Válidos</div>
          </CardContent>
        </Card>
        
        <Card className="flex-1 min-w-[110px]">
          <CardContent className="p-3 flex flex-col items-center">
            <AlertTriangle className="h-4 w-4 text-amber-500 mb-1" />
            <div className="text-sm font-semibold">{invalidNumbers}</div>
            <div className="text-xs text-muted-foreground">Inválidos</div>
          </CardContent>
        </Card>
        
        <Card className="flex-1 min-w-[110px]">
          <CardContent className="p-3 flex flex-col items-center">
            <CopyCheck className="h-4 w-4 text-red-500 mb-1" />
            <div className="text-sm font-semibold">{duplicateNumbers}</div>
            <div className="text-xs text-muted-foreground">Duplicados</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{filteredRecords}</div>
              <div className="text-sm text-muted-foreground">Registros exibidos</div>
            </div>
          </div>
          {totalRecords > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((filteredRecords / totalRecords) * 100).toFixed(1)}% do total de {totalRecords}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{validPhoneNumbers}</div>
              <div className="text-sm text-muted-foreground">Números válidos</div>
            </div>
          </div>
          {filteredRecords > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((validPhoneNumbers / filteredRecords) * 100).toFixed(1)}% dos registros
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-2xl font-bold">{invalidNumbers}</div>
              <div className="text-sm text-muted-foreground">Números inválidos</div>
            </div>
          </div>
          {filteredRecords > 0 && invalidNumbers > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((invalidNumbers / (invalidNumbers + validPhoneNumbers)) * 100).toFixed(1)}% dos números
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CopyCheck className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{duplicateNumbers}</div>
              <div className="text-sm text-muted-foreground">Duplicados</div>
            </div>
          </div>
          {filteredRecords > 0 && duplicateNumbers > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {((duplicateNumbers / (duplicateNumbers + validPhoneNumbers)) * 100).toFixed(1)}% dos números
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCard;
