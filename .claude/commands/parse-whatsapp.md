# /parse-whatsapp

## Description
Parse a WhatsApp chat export file and extract Q&A pairs.

## Usage
```
/parse-whatsapp <path-to-file.txt>
```

## Options
- `--output <path>` - Output JSON file path (default: `/src/data/all-conversations.json`)
- `--append` - Append to existing conversations instead of replacing

## Example
```bash
/parse-whatsapp ~/Downloads/WhatsApp\ Chat\ -\ צוות\ גוליקה.txt
```

## Output
Creates/updates:
- `/src/data/all-conversations.json` - Full conversation list
- Updates topic statistics automatically
