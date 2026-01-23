# Semantic Search Skill

## Purpose
Provide semantic search over the knowledge base for finding relevant answers.

## Features
- Keyword-based topic detection
- Hebrew text normalization
- Frequency-weighted results

## Configuration
- Topics defined in `/src/data/jolika-data.ts` with keywords
- `detectTopic()` function for classification

## Usage
```typescript
import { detectTopic, getProcessedKnowledge } from '@/data/jolika-data'

const topic = detectTopic(userQuestion)
const knowledge = getProcessedKnowledge()
```

## Future Enhancements
- OpenAI embeddings for semantic similarity
- Vector database integration
- Confidence scoring
