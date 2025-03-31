
import { validBrazilianDDDs } from '../utils/phoneUtils';

/**
 * Enum representing validation issues for Brazilian phone numbers
 */
export enum PhoneValidationIssue {
  NONE = "Válido",
  EMPTY = "Número vazio",
  WRONG_LENGTH = "Tamanho incorreto",
  INVALID_DDD = "DDD inválido",
  INVALID_MOBILE_PREFIX = "Prefixo móvel inválido",
  SEQUENTIAL_PATTERN = "Padrão sequencial",
  REPEATED_PATTERN = "Padrão repetido"
}

/**
 * Validates a Brazilian phone number and returns specific validation issue if any
 */
export function validateBrazilianPhoneNumber(phoneNumber: string): PhoneValidationIssue {
  // Handle empty number
  if (!phoneNumber || phoneNumber.trim() === '') {
    return PhoneValidationIssue.EMPTY;
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check proper format: must start with 55, followed by valid DDD (2 digits), followed by 9 digits
  // Must be exactly 13 digits for a valid Brazilian mobile number
  if (cleaned.length !== 13) {
    return PhoneValidationIssue.WRONG_LENGTH;
  }
  
  if (!cleaned.startsWith('55')) {
    return PhoneValidationIssue.WRONG_LENGTH;
  }
  
  // Extract DDD and number without country code
  const ddd = cleaned.substring(2, 4);
  
  // Check for valid DDD using our comprehensive list
  if (!validBrazilianDDDs.includes(ddd)) {
    return PhoneValidationIssue.INVALID_DDD;
  }
  
  const number = cleaned.substring(4);
  
  // Check for sequential patterns (123456789, etc)
  if (/^(\d)\1+$/.test(number)) {
    return PhoneValidationIssue.REPEATED_PATTERN;
  }
  
  if (/^0123456789|1234567890$/.test(number) || /^9876543210|0987654321$/.test(number)) {
    return PhoneValidationIssue.SEQUENTIAL_PATTERN;
  }
  
  // For mobile numbers, should start with 9 (if it's 9 digits)
  if (number.length === 9 && !number.startsWith('9')) {
    return PhoneValidationIssue.INVALID_MOBILE_PREFIX;
  }
  
  return PhoneValidationIssue.NONE;
}

/**
 * Get validation issue color for display
 */
export function getValidationColor(issue: PhoneValidationIssue): string {
  switch (issue) {
    case PhoneValidationIssue.NONE:
      return "text-green-600";
    case PhoneValidationIssue.EMPTY:
      return "text-gray-400";
    default:
      return "text-red-600";
  }
}
