
/**
 * Formats a phone number to Brazilian standard (country code + DDD + number)
 * Removes all non-digit characters and ensures it starts with 55 (Brazil code)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it's empty, return empty string
  if (!digitsOnly) return '';
  
  // If it doesn't start with 55 (Brazil), add it
  if (!digitsOnly.startsWith('55')) {
    digitsOnly = '55' + digitsOnly;
  }
  
  // Make sure it has the right length for a Brazilian mobile (13 digits including country code)
  // If it's too short or obviously invalid, return the cleaned number anyway
  return digitsOnly;
}

/**
 * List of valid Brazilian DDD codes
 * This is a comprehensive list of all valid DDD codes in Brazil
 */
const validBrazilianDDDs = [
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
 * Checks if a phone number is valid Brazilian mobile number
 * Valid format: 55 + DDD (2 digits) + 9 (for mobile) + 8 digits
 * Also performs basic pattern validation to filter out sequential or random numbers
 */
export function isValidBrazilianNumber(phoneNumber: string): boolean {
  // First clean the number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's empty
  if (!cleaned) return false;
  
  // Check proper format: must start with 55, followed by valid DDD (2 digits), followed by 9 digits
  // Must be exactly 13 digits for a valid Brazilian mobile number
  if (cleaned.length !== 13 || !cleaned.startsWith('55')) {
    return false;
  }
  
  // Extract DDD and number without country code
  const ddd = cleaned.substring(2, 4);
  const number = cleaned.substring(4);
  
  // Check for valid DDD using our comprehensive list
  if (!validBrazilianDDDs.includes(ddd)) {
    return false;
  }
  
  // Check for sequential patterns (123456789, etc)
  if (/^(\d)\1+$/.test(number) ||             // All digits are the same (e.g., 999999999)
      /^0123456789|1234567890$/.test(number) ||  // Sequential ascending
      /^9876543210|0987654321$/.test(number)) {  // Sequential descending
    return false;
  }
  
  // For mobile numbers, should start with 9 (if it's 9 digits)
  if (number.length === 9 && !number.startsWith('9')) {
    return false;
  }
  
  return true;
}

/**
 * Extracts all unique valid phone numbers from lead data
 * Filters out invalid and blank phone numbers
 */
export function extractPhoneNumbers(data: any[]): string[] {
  const numbers = new Set<string>();
  
  data.forEach(row => {
    // Try to get phone from Celular or Telefone fields
    const phoneNumber = row['Celular'] || row['Telefone'];
    
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
