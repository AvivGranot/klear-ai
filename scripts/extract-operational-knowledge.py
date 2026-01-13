#!/usr/bin/env python3
"""
Extract OPERATIONAL knowledge from WhatsApp chat.
Focus on substantive Q&A, not greetings.
"""

import re
import json
from collections import Counter, defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/operational-knowledge.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

# Greetings and noise to filter out
GREETING_PATTERNS = [
    'בוקר טוב', 'צהריים טובים', 'ערב טוב', 'לילה טוב',
    'שבוע טוב', 'שבת שלום', 'חג שמח',
    'תודה', 'תודה רבה', 'בבקשה',
    'חחח', 'הההה', 'לול', 'אמן',
    'שלום', 'היי', 'הי',
    '@', 'מצויין', 'סבבה', 'אוקיי', 'ok'
]

# Operational keywords that indicate useful content
OPERATIONAL_KEYWORDS = [
    # Fuel
    'דלק', 'תדלוק', 'משאבה', 'סולר', 'בנזין', 'ליטר',
    # Payment
    'קופה', 'תשלום', 'כרטיס', 'מזומן', 'קבלה', 'חשבונית',
    # Shifts
    'משמרת', 'משמרות', 'עבודה', 'סידור',
    # Safety
    'נכה', 'חשוד', 'בטיחות', 'מטף', 'חירום',
    # Equipment
    'מכונה', 'טרמינל', 'שטיפה', 'אקדח',
    # Inventory
    'מלאי', 'הזמנה', 'שמן', 'מוצר',
    # Procedures
    'אסור', 'מותר', 'חובה', 'שימו לב', 'אישור'
]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def is_greeting_or_noise(text):
    """Check if text is just a greeting or noise."""
    text_lower = text.lower()

    # Too short
    if len(text) < 5:
        return True

    # Check against greeting patterns
    for pattern in GREETING_PATTERNS:
        if text_lower.startswith(pattern.lower()) or text_lower == pattern.lower():
            # Allow if there's more content after the greeting
            remaining = text_lower.replace(pattern.lower(), '').strip()
            if len(remaining) < 10:
                return True

    return False

def has_operational_content(text):
    """Check if text contains operational keywords."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in OPERATIONAL_KEYWORDS)

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

    # PART 1: Extract Nevo's standalone operational messages
    print("\n=== EXTRACTING NEVO'S OPERATIONAL MESSAGES ===")
    nevo_operational = []
    nevo_msg_counter = Counter()

    for msg in messages:
        if not msg['is_manager'] or msg['is_media']:
            continue

        text = msg['text']

        # Skip greetings and noise
        if is_greeting_or_noise(text):
            continue

        # Must have some length
        if len(text) < 15:
            continue

        # Track frequency
        nevo_msg_counter[text] += 1

    # Get messages sent at least 2 times
    repeated_nevo_msgs = [(msg, count) for msg, count in nevo_msg_counter.items() if count >= 2]
    repeated_nevo_msgs.sort(key=lambda x: x[1], reverse=True)

    print(f"Nevo's repeated operational messages: {len(repeated_nevo_msgs)}")
    for msg, count in repeated_nevo_msgs[:10]:
        print(f"  [{count}x] {msg[:60]}")

    # PART 2: Extract Q&A pairs with operational content
    print("\n=== EXTRACTING OPERATIONAL Q&A PAIRS ===")
    qa_pairs = []
    qa_counter = defaultdict(list)

    for i, msg in enumerate(messages):
        # Find employee questions with operational content
        if msg['is_manager'] or msg['is_media']:
            continue

        q_text = msg['text']

        # Skip greetings
        if is_greeting_or_noise(q_text):
            continue

        # Must have some substance
        if len(q_text) < 10 or len(q_text) > 200:
            continue

        # Look for Nevo's response
        for j in range(i+1, min(i+8, len(messages))):
            next_msg = messages[j]
            if next_msg['is_manager'] and not next_msg['is_media']:
                a_text = next_msg['text']

                # Skip greeting responses
                if is_greeting_or_noise(a_text):
                    continue

                # Response must have substance
                if len(a_text) < 10:
                    continue

                # At least one should have operational content
                if has_operational_content(q_text) or has_operational_content(a_text):
                    qa_pairs.append({
                        'question': q_text,
                        'answer': a_text,
                        'date': msg['date']
                    })
                break

    print(f"Operational Q&A pairs found: {len(qa_pairs)}")

    # Deduplicate Q&A pairs
    unique_qa = {}
    for qa in qa_pairs:
        key = qa['question'][:50].lower()
        if key not in unique_qa:
            unique_qa[key] = qa

    qa_list = list(unique_qa.values())
    print(f"Unique operational Q&A pairs: {len(qa_list)}")

    # Show samples
    print("\nSample operational Q&A:")
    for qa in qa_list[:5]:
        print(f"  Q: {qa['question'][:50]}")
        print(f"  A: {qa['answer'][:50]}")
        print()

    # PART 3: Build final knowledge base
    print("\n=== BUILDING KNOWLEDGE BASE ===")
    knowledge_items = []

    # Add Nevo's repeated operational messages as instructions
    for msg, count in repeated_nevo_msgs:
        knowledge_items.append({
            'title': msg[:100],
            'titleHe': msg[:100],
            'content': msg,
            'contentHe': msg,
            'type': 'instruction',
            'source': 'nevo_repeated',
            'frequency': count
        })

    # Add operational Q&A pairs
    for qa in qa_list:
        content = f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ - מנהל): {qa['answer']}"
        knowledge_items.append({
            'title': qa['question'][:100],
            'titleHe': qa['question'][:100],
            'content': content,
            'contentHe': content,
            'type': 'faq',
            'source': 'operational_qa',
            'frequency': 1
        })

    print(f"Total knowledge items: {len(knowledge_items)}")
    print(f"  - Repeated instructions: {len(repeated_nevo_msgs)}")
    print(f"  - Q&A pairs: {len(qa_list)}")

    # Save
    output = {
        'total_items': len(knowledge_items),
        'repeated_instructions': len(repeated_nevo_msgs),
        'qa_pairs': len(qa_list),
        'items': knowledge_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
