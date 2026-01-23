# /test-bot

## Description
Test the bot with sample questions and view responses.

## Usage
```
/test-bot "<question>"
```

## Examples
```bash
/test-bot "איך מחברים את השוקולד לגובה?"
/test-bot "מה שעות העבודה של החנות?"
/test-bot "יש אלרגנים בפרלין הלבן?"
```

## Output
```
Question: איך מחברים את השוקולד לגובה?
Topic: אריזות
Confidence: 0.92
Source: automation_pattern
Response: בקומה התחתונה גרנד. בקומה האמצעית לוקחים קופסת ג׳וליקה...
```

## Test Suite
Run all test questions:
```bash
/test-bot --suite
```
