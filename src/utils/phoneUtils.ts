
/**
 * Formats a phone number to Brazilian standard (country code + DDD + number)
 * Removes all non-digit characters and ensures it starts with 55 (Brazil code)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it's empty, return empty string
  if (!digitsOnly) return '';
  
  // Handle different formats
  if (digitsOnly.length === 11 && !digitsOnly.startsWith('55')) {
    // Format is likely DDD + number without country code
    digitsOnly = '55' + digitsOnly;
  } else if (digitsOnly.length === 9) {
    // Only the number, without DDD or country code
    // Can't automatically format as we don't know the DDD
    return digitsOnly;
  } else if (digitsOnly.length === 10 && !digitsOnly.startsWith('55')) {
    // Likely a landline number with DDD (10 digits)
    digitsOnly = '55' + digitsOnly;
  } else if (!digitsOnly.startsWith('55') && digitsOnly.length >= 10) {
    // Add Brazil country code
    digitsOnly = '55' + digitsOnly;
  }
  
  // Trim to standard 13 digits if longer
  if (digitsOnly.length > 13) {
    digitsOnly = digitsOnly.substring(0, 13);
  }
  
  return digitsOnly;
}

/**
 * List of valid Brazilian DDD codes
 * This is a comprehensive list of all valid DDD codes in Brazil
 */
export const validBrazilianDDDs = [
  // São Paulo
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  // Rio de Janeiro
  '21', '22', '24',
  // Espírito Santo
  '27', '28',
  // Minas Gerais
  '31', '32', '33', '34', '35', '37', '38',
  // Paraná
  '41', '42', '43', '44', '45', '46',
  // Santa Catarina
  '47', '48', '49',
  // Rio Grande do Sul
  '51', '53', '54', '55',
  // Distrito Federal e Goiás
  '61', '62', '64',
  // Mato Grosso
  '65', '66',
  // Mato Grosso do Sul
  '67',
  // Acre e Rondônia
  '68', '69',
  // Bahia
  '71', '73', '74', '75', '77',
  // Sergipe
  '79',
  // Pernambuco
  '81', '87',
  // Alagoas
  '82',
  // Paraíba
  '83',
  // Rio Grande do Norte
  '84',
  // Ceará
  '85', '88',
  // Piauí
  '86', '89',
  // Pará
  '91', '93', '94',
  // Amazonas
  '92', '97',
  // Roraima
  '95',
  // Amapá
  '96',
  // Tocantins
  '63',
  // Maranhão
  '98', '99'
];

/**
 * Map of DDD codes to state names for display
 */
export const dddToState: Record<string, string> = {
  // São Paulo
  '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', 
  '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  // Rio de Janeiro
  '21': 'RJ', '22': 'RJ', '24': 'RJ',
  // Espírito Santo
  '27': 'ES', '28': 'ES',
  // Minas Gerais
  '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
  // Paraná
  '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
  // Santa Catarina
  '47': 'SC', '48': 'SC', '49': 'SC',
  // Rio Grande do Sul
  '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
  // Distrito Federal e Goiás
  '61': 'DF/GO', '62': 'GO', '64': 'GO',
  // Mato Grosso
  '65': 'MT', '66': 'MT',
  // Mato Grosso do Sul
  '67': 'MS',
  // Acre e Rondônia
  '68': 'AC', '69': 'RO',
  // Bahia
  '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
  // Sergipe
  '79': 'SE',
  // Pernambuco
  '81': 'PE', '87': 'PE',
  // Alagoas
  '82': 'AL',
  // Paraíba
  '83': 'PB',
  // Rio Grande do Norte
  '84': 'RN',
  // Ceará
  '85': 'CE', '88': 'CE',
  // Piauí
  '86': 'PI', '89': 'PI',
  // Pará
  '91': 'PA', '93': 'PA', '94': 'PA',
  // Amazonas
  '92': 'AM', '97': 'AM',
  // Roraima
  '95': 'RR',
  // Amapá
  '96': 'AP',
  // Tocantins
  '63': 'TO',
  // Maranhão
  '98': 'MA', '99': 'MA'
};

/**
 * Checks if a phone number is valid Brazilian mobile number
 * Valid format: 55 + DDD (2 digits) + 9 (for mobile) + 8 digits
 * Also performs basic pattern validation to filter out sequential or random numbers
 */
export function isValidBrazilianNumber(phoneNumber: string): boolean {
  // First clean the number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's empty
  if (!cleaned) return false;
  
  // Check proper format for mobile with country code: 55 + DDD (2 digits) + 9 + 8 digits = 13 digits total
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // Extract DDD and number without country code
    const ddd = cleaned.substring(2, 4);
    const number = cleaned.substring(4);
    
    // Check for valid DDD using our comprehensive list
    if (!validBrazilianDDDs.includes(ddd)) {
      return false;
    }
    
    // For mobile numbers, should start with 9 (if it's 9 digits)
    if (number.length === 9 && !number.startsWith('9')) {
      return false;
    }
    
    // Check for sequential patterns (123456789, etc)
    if (/^(\d)\1+$/.test(number) ||             // All digits are the same (e.g., 999999999)
        /^0123456789|1234567890$/.test(number) ||  // Sequential ascending
        /^9876543210|0987654321$/.test(number)) {  // Sequential descending
      return false;
    }
    
    return true;
  }
  
  // Check for 11-digit format (DDD + 9-digit mobile number without country code)
  if (cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);
    
    // Check valid DDD
    if (!validBrazilianDDDs.includes(ddd)) {
      return false;
    }
    
    // Check first digit is 9 for mobile
    if (!number.startsWith('9')) {
      return false;
    }
    
    return true;
  }
  
  // Check for 10-digit format (DDD + 8-digit landline)
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    
    // Check valid DDD
    if (!validBrazilianDDDs.includes(ddd)) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Extracts all unique valid phone numbers from lead data
 * Uses both Celular and Telefone fields, prioritizing Celular if both exist
 * Filters out invalid and blank phone numbers
 */
export function extractPhoneNumbers(data: any[]): string[] {
  const numbers = new Set<string>();
  
  data.forEach(row => {
    // Try to get phone from Celular field first, then Telefone if Celular is empty
    let phoneNumber = row['Celular'] && row['Celular'].trim() !== '' 
      ? row['Celular'] 
      : (row['Telefone'] && row['Telefone'].trim() !== '' ? row['Telefone'] : '');
    
    // Skip empty/blank phone numbers
    if (!phoneNumber || phoneNumber.trim() === '') {
      return;
    }
    
    // Format the number first
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Only add numbers that are valid Brazilian mobile numbers
    if (formattedNumber && isValidBrazilianNumber(formattedNumber)) {
      numbers.add(formattedNumber);
    }
  });
  
  return Array.from(numbers);
}

/**
 * Format a phone number for display in a human-readable format
 * Example: 5511987654321 -> +55 (11) 98765-4321
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it's empty or too short, return the original
  if (!digitsOnly || digitsOnly.length < 10) return phoneNumber;
  
  // Format for display based on length
  try {
    if (digitsOnly.length === 13 && digitsOnly.startsWith('55')) {
      // Full format with country code
      const countryCode = digitsOnly.substring(0, 2);
      const ddd = digitsOnly.substring(2, 4);
      const prefix = digitsOnly.substring(4, 9);
      const suffix = digitsOnly.substring(9);
      
      return `+${countryCode} (${ddd}) ${prefix}-${suffix}`;
    } else if (digitsOnly.length === 11) {
      // DDD + number without country code
      const ddd = digitsOnly.substring(0, 2);
      const prefix = digitsOnly.substring(2, 7);
      const suffix = digitsOnly.substring(7);
      
      return `(${ddd}) ${prefix}-${suffix}`;
    } else if (digitsOnly.length === 9) {
      // Just the number
      const prefix = digitsOnly.substring(0, 5);
      const suffix = digitsOnly.substring(5);
      
      return `${prefix}-${suffix}`;
    }
    
    // For other formats, just return the cleaned digits
    return digitsOnly;
  } catch (error) {
    return phoneNumber;
  }
}

/**
 * Get state name from phone number
 */
export function getStateFromPhoneNumber(phoneNumber: string): string | null {
  try {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length >= 4 && cleaned.startsWith('55')) {
      const ddd = cleaned.substring(2, 4);
      return dddToState[ddd] || null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
