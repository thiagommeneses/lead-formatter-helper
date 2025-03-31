
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
 * Checks if a phone number is valid Brazilian mobile number
 * Valid format: 55 + DDD (2 digits) + 9 (for mobile) + 8 digits
 */
export function isValidBrazilianNumber(phoneNumber: string): boolean {
  // First clean the number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's empty
  if (!cleaned) return false;
  
  // Check proper format: must start with 55, followed by DDD (2 digits), followed by 9 digits
  return /^55\d{10,11}$/.test(cleaned);
}

/**
 * Extracts all unique valid phone numbers from lead data
 */
export function extractPhoneNumbers(data: any[]): string[] {
  const numbers = new Set<string>();
  
  data.forEach(row => {
    // Try to get phone from Celular or Telefone fields
    const phoneNumber = row['Celular'] || row['Telefone'];
    if (phoneNumber && isValidBrazilianNumber(phoneNumber)) {
      // Use cleaned number
      numbers.add(formatPhoneNumber(phoneNumber));
    }
  });
  
  return Array.from(numbers);
}
