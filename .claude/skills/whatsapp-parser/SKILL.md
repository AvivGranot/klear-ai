# WhatsApp Parser Skill

## Purpose
Parse WhatsApp chat exports to extract Q&A pairs between employees and managers.

## Input
- WhatsApp `.txt` export files
- Format: `[DD/MM/YYYY, HH:MM:SS] Sender Name: Message`

## Output
- Structured JSON with conversation pairs
- Question/answer matching based on reply timing
- Media file references

## Usage
```bash
# Parse a WhatsApp export
/parse-whatsapp <path-to-export.txt>
```

## Configuration
- Manager names are identified from `/src/data/jolika-data.ts`
- Question/answer pairing uses 5-minute window
- Hebrew date format supported

## Files
- `/src/data/all-conversations.json` - Parsed output
- `/src/data/whatsapp-faqs.json` - FAQ patterns
