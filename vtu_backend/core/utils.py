"""
Core utility functions for input normalization
File: core/utils.py
"""
import re

def normalize_nigerian_phone(phone_number: str, target_format: str = 'local') -> str:
    """
    Normalizes Nigerian phone numbers to prevent aggregator API failures.
    Formats:
        - 'local': formats to 11 digits (e.g., 08031234567)
        - 'international': formats to 13 digits (e.g., 2348031234567)
    """
    if not phone_number:
        return ""

    # Remove all non-numeric characters (spaces, dashes, plus signs, letters)
    cleaned = re.sub(r'\D', '', phone_number)
    
    # Strip leading country code if present (e.g., 234803...)
    if cleaned.startswith('234') and len(cleaned) > 10:
        local_number = cleaned[3:]
    # Strip leading zero if present on a standard 11-digit number
    elif cleaned.startswith('0') and len(cleaned) == 11:
        local_number = cleaned[1:]
    else:
        local_number = cleaned

    # Check if we have exactly 10 digits left (e.g., 8031234567)
    if len(local_number) != 10:
        # If it doesn't look like a standard Nigerian number, return the cleaned version as a fallback
        return cleaned

    # Format to target
    if target_format == 'local':
        return f"0{local_number}"
    elif target_format == 'international':
        return f"234{local_number}"
        
    return cleaned