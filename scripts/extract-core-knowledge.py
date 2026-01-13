#!/usr/bin/env python3
"""
Extract CORE operational knowledge from WhatsApp chat.
Focus on:
1. Nevo's repeated messages (instructions/alerts)
2. True Q&A patterns where similar questions get similar answers
"""

import re
import json
from collections import Counter, defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/core-knowledge.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

# Filter out these patterns
NOISE_PATTERNS = [
    r'^בוקר טוב', r'^צהריים טובים', r'^ערב טוב', r'^לילה טוב',
    r'^שבוע טוב', r'^שבת שלום', r'^חג שמח',
    r'^תודה', r'^בבקשה$', r'^אמן$',
    r'^חח+$', r'^ההה+$', r'^לול$',
    r'^שלום$', r'^היי$', r'^הי$',
    r'^@', r'^מצויין$', r'^סבבה$', r'^אוקיי$', r'^ok$',
    r'^מחקת את ההודעה', r'^בהמתנה להודעה'
]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def is_noise(text):
    """Check if text is noise/greeting."""
    if len(text) < 5:
        return True
    text_lower = text.lower()
    for pattern in NOISE_PATTERNS:
        if re.match(pattern, text_lower):
            return True
    return False

def normalize(text):
    """Normalize for comparison."""
    text = clean_text(text).lower()
    text = re.sub(r'[?.!,\-\'\"()]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

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

    # ============================================
    # PART 1: Nevo's repeated substantive messages
    # ============================================
    print("\n=== NEVO'S REPEATED MESSAGES ===")
    nevo_counter = Counter()
    nevo_examples = {}

    for msg in messages:
        if not msg['is_manager'] or msg['is_media']:
            continue
        text = msg['text']
        if is_noise(text) or len(text) < 15:
            continue

        norm = normalize(text)
        if len(norm) < 10:
            continue

        nevo_counter[norm] += 1
        if norm not in nevo_examples:
            nevo_examples[norm] = text

    nevo_repeated = [(norm, count, nevo_examples[norm])
                     for norm, count in nevo_counter.items() if count >= 2]
    nevo_repeated.sort(key=lambda x: x[1], reverse=True)

    print(f"Found {len(nevo_repeated)} repeated messages from Nevo:")
    for norm, count, example in nevo_repeated[:15]:
        print(f"  [{count}x] {example[:60]}")

    # ============================================
    # PART 2: Substantive Q&A patterns
    # ============================================
    print("\n=== SUBSTANTIVE Q&A PAIRS ===")

    # Collect all Q&A where employee asks and Nevo responds
    qa_raw = []
    for i, msg in enumerate(messages):
        if msg['is_manager'] or msg['is_media']:
            continue

        q_text = msg['text']
        if is_noise(q_text) or len(q_text) < 8:
            continue

        # Find Nevo's next response (within 5 messages)
        for j in range(i+1, min(i+5, len(messages))):
            next_msg = messages[j]
            if next_msg['is_manager'] and not next_msg['is_media']:
                a_text = next_msg['text']
                if is_noise(a_text) or len(a_text) < 8:
                    continue

                qa_raw.append({
                    'question': q_text,
                    'answer': a_text,
                    'date': msg['date']
                })
                break

    print(f"Raw Q&A pairs: {len(qa_raw)}")

    # Filter to keep only substantive ones
    substantive_qa = []
    seen_q = set()

    for qa in qa_raw:
        q = qa['question']
        a = qa['answer']

        # Skip if we've seen this question
        q_key = normalize(q)[:40]
        if q_key in seen_q:
            continue
        seen_q.add(q_key)

        # Both must be non-trivial
        if len(q) < 10 or len(a) < 10:
            continue

        # Answer shouldn't be the same as question
        if normalize(q) == normalize(a):
            continue

        # Keep it
        substantive_qa.append(qa)

    print(f"Substantive unique Q&A pairs: {len(substantive_qa)}")

    # Show samples
    print("\nSample Q&A pairs:")
    for qa in substantive_qa[:10]:
        print(f"  Q: {qa['question'][:50]}")
        print(f"  A: {qa['answer'][:50]}")
        print()

    # ============================================
    # PART 3: Build knowledge base
    # ============================================
    print("\n=== BUILDING KNOWLEDGE BASE ===")
    knowledge_items = []

    # Add Nevo's repeated messages (alerts/instructions)
    for norm, count, example in nevo_repeated:
        knowledge_items.append({
            'title': example[:100],
            'titleHe': example[:100],
            'content': example,
            'contentHe': example,
            'type': 'instruction',
            'source': 'manager_repeated',
            'frequency': count
        })

    print(f"Added {len(nevo_repeated)} repeated instructions from Nevo")

    # Add substantive Q&A pairs (limit to most recent/relevant)
    # Sort by date (most recent first) and take top 200
    substantive_qa.sort(key=lambda x: x['date'], reverse=True)
    top_qa = substantive_qa[:200]

    for qa in top_qa:
        content = f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ - מנהל): {qa['answer']}"
        knowledge_items.append({
            'title': qa['question'][:100],
            'titleHe': qa['question'][:100],
            'content': content,
            'contentHe': content,
            'type': 'faq',
            'source': 'qa_pair',
            'frequency': 1
        })

    print(f"Added {len(top_qa)} Q&A pairs")
    print(f"Total knowledge items: {len(knowledge_items)}")

    # Save
    output = {
        'total_items': len(knowledge_items),
        'instructions_count': len(nevo_repeated),
        'qa_count': len(top_qa),
        'items': knowledge_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
