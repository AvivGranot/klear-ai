# /seed-knowledge

## Description
Seed the database with knowledge items from JSON files.

## Usage
```
/seed-knowledge
```

## Options
- `--reset` - Clear existing knowledge before seeding
- `--source <file>` - Specific JSON file to import

## Data Sources
- `/src/data/whatsapp-faqs.json` - FAQ patterns from managers
- `/src/data/categories.json` - Topic categories

## API Endpoint
```bash
POST /api/seed
```

## Notes
- Idempotent - safe to run multiple times
- Creates demo company if not exists
