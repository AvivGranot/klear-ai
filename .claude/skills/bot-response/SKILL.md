# Bot Response Skill

## Purpose
Generate bot responses to employee questions using knowledge base and automation patterns.

## Flow
1. Receive question from employee
2. Detect topic using keywords
3. Search knowledge base for relevant content
4. Check automation patterns for exact/similar matches
5. Generate response with confidence score
6. Log conversation for manager review

## API
```typescript
POST /api/chat
{
  "companyId": "jolika-chocolate",
  "userId": "employee-123",
  "message": "איך מחברים את השוקולד לגובה?"
}
```

## Response Format
```typescript
{
  "response": "...",
  "confidence": 0.85,
  "source": "automation_pattern" | "knowledge_base" | "ai_generated",
  "knowledgeItemId": "kb-123"
}
```

## Manager Corrections
- Managers can correct bot responses via dashboard
- Corrections feed back into automation patterns
