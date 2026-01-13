#!/usr/bin/env python3
"""
Extract Nevo's operational knowledge - FINAL VERSION.
Focus on his actual messages, not forced Q&A pairing.
"""

import re
import json
from collections import Counter

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/nevo-operational.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

# Noise patterns to filter
NOISE_WORDS = [
    'בוקר טוב', 'צהריים טובים', 'ערב טוב', 'לילה טוב',
    'שבוע טוב', 'שבת שלום', 'חג שמח', 'שנה טובה',
    'תודה', 'בבקשה', 'אמן', 'חחח', 'לול', 'הההה',
    'שלום', 'היי', 'הי', 'מצויין', 'סבבה', 'אוקיי',
    'מחקת את ההודעה', 'בהמתנה להודעה', 'התמונה הושמטה'
]

# Operational keywords - messages containing these are valuable
OPERATIONAL_KEYWORDS = [
    # Safety & Alerts
    'נכה', 'חשוד', 'מטף', 'חירום', 'בטיחות', 'משטרה', 'שוטר',
    # Fuel
    'דלק', 'תדלוק', 'משאבה', 'סולר', 'בנזין', 'ליטר', 'אקדח',
    # Payment
    'קופה', 'תשלום', 'כרטיס', 'מזומן', 'קבלה', 'חשבונית', 'מחיר',
    # Equipment
    'מכונה', 'טרמינל', 'שטיפה', 'מדפסת',
    # Inventory
    'מלאי', 'הזמנה', 'שמן', 'חלב', 'מוצר', 'סחורה',
    # Procedures
    'אסור', 'מותר', 'חובה', 'צריך', 'שימו לב', 'אישור', 'נוהל',
    # Shift
    'משמרת', 'סידור', 'החלפה',
    # Customer service
    'לקוח', 'תלונה', 'שירות', 'ארוחה'
]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def is_noise(text):
    """Check if message is just noise/greeting."""
    text_lower = text.lower()
    if len(text) < 8:
        return True
    for noise in NOISE_WORDS:
        if text_lower.startswith(noise.lower()) and len(text) < 30:
            return True
        if text_lower == noise.lower():
            return True
    return False

def has_operational_content(text):
    """Check if message has operational content."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in OPERATIONAL_KEYWORDS)

def normalize(text):
    """Normalize for deduplication."""
    text = clean_text(text).lower()
    text = re.sub(r'[?.!,\-\'\"()]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()[:60]

def parse_chat(filepath):
    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            match = MESSAGE_PATTERN.match(line)
            if match:
                date, time, sender, text = match.groups()
                sender = clean_text(sender)
                text = clean_text(text)

                if 'בהמתנה להודעה' in text or 'הודעה זו נמחקה' in text:
                    continue

                messages.append({
                    'date': date,
                    'sender': sender,
                    'text': text,
                    'is_manager': any(name in sender for name in MANAGER_NAMES),
                    'is_media': '<מצורף:' in text or 'התמונה הושמטה' in text
                })
    return messages

def main():
    print("Parsing chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Total messages: {len(messages)}")

    # Get all Nevo's text messages
    nevo_messages = []
    for msg in messages:
        if not msg['is_manager'] or msg['is_media']:
            continue
        text = msg['text']
        if is_noise(text):
            continue
        nevo_messages.append({'text': text, 'date': msg['date']})

    print(f"Nevo's non-noise messages: {len(nevo_messages)}")

    # Count frequency
    counter = Counter()
    examples = {}
    for msg in nevo_messages:
        norm = normalize(msg['text'])
        if len(norm) < 10:
            continue
        counter[norm] += 1
        if norm not in examples:
            examples[norm] = {'text': msg['text'], 'date': msg['date']}

    # Categorize
    repeated = []  # Messages sent 2+ times
    operational = []  # Messages with operational keywords
    seen = set()

    # Get repeated messages
    for norm, count in counter.items():
        if count >= 2:
            repeated.append({
                'text': examples[norm]['text'],
                'date': examples[norm]['date'],
                'count': count
            })
            seen.add(norm)

    repeated.sort(key=lambda x: x['count'], reverse=True)
    print(f"\nRepeated messages (2+ times): {len(repeated)}")
    for item in repeated[:10]:
        print(f"  [{item['count']}x] {item['text'][:60]}")

    # Get operational messages (not already in repeated)
    for msg in nevo_messages:
        norm = normalize(msg['text'])
        if norm in seen:
            continue
        if has_operational_content(msg['text']) and len(msg['text']) >= 15:
            operational.append({
                'text': msg['text'],
                'date': msg['date'],
                'count': 1
            })
            seen.add(norm)

    print(f"\nOperational messages: {len(operational)}")
    for item in operational[:10]:
        print(f"  {item['text'][:60]}")

    # Build knowledge base
    print("\n=== BUILDING KNOWLEDGE BASE ===")
    knowledge_items = []

    # Add repeated messages as high-priority
    for item in repeated:
        knowledge_items.append({
            'title': item['text'][:100],
            'titleHe': item['text'][:100],
            'content': f"הודעת מנהל (נבו פרץ): {item['text']}",
            'contentHe': f"הודעת מנהל (נבו פרץ): {item['text']}",
            'type': 'instruction',
            'source': 'manager_repeated',
            'frequency': item['count'],
            'priority': 'high'
        })

    # Add operational messages
    for item in operational[:150]:  # Limit to top 150
        knowledge_items.append({
            'title': item['text'][:100],
            'titleHe': item['text'][:100],
            'content': f"הנחיית מנהל (נבו פרץ): {item['text']}",
            'contentHe': f"הנחיית מנהל (נבו פרץ): {item['text']}",
            'type': 'instruction',
            'source': 'manager_operational',
            'frequency': 1,
            'priority': 'normal'
        })

    print(f"Total knowledge items: {len(knowledge_items)}")
    print(f"  - Repeated (high priority): {len(repeated)}")
    print(f"  - Operational (normal): {min(len(operational), 150)}")

    # Save
    output = {
        'manager': 'נבו פרץ (Nevo Perets)',
        'total_items': len(knowledge_items),
        'high_priority': len(repeated),
        'normal_priority': min(len(operational), 150),
        'items': knowledge_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
