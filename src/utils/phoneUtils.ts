
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
 * Also performs basic pattern validation to filter out sequential or random numbers
 */
export function isValidBrazilianNumber(phoneNumber: string): boolean {
  // First clean the number
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's empty
  if (!cleaned) return false;
  
  // Check proper format: must start with 55, followed by DDD (2 digits), followed by 9 digits
  if (!/^55\d{10,11}$/.test(cleaned)) {
    return false;
  }
  
  // Extract DDD and number without country code
  const ddd = cleaned.substring(2, 4);
  const number = cleaned.substring(4);
  
  // Check for valid DDD (very basic check)
  // Brazilian DDDs range from 11 to 99, but not all numbers in this range are valid
  // This is a simplified check
  if (Number(ddd) < 11 || Number(ddd) > 99) {
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
