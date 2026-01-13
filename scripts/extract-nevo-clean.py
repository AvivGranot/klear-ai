#!/usr/bin/env python3
"""
Extract CLEAN knowledge from Nevo Perets (manager) responses.
Focus on his direct text answers, not noisy context.
"""

import re
import json
from pathlib import Path

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/nevo-knowledge.json"

# Manager identifiers
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

# Message pattern
MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')

def clean_text(text):
    """Clean invisible chars."""
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def parse_chat(filepath):
    """Parse WhatsApp chat into messages."""
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

                # Skip system messages
                if 'בהמתנה להודעה' in text or 'הודעה זו נמחקה' in text:
                    continue

                messages.append({
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'text': text,
                    'is_manager': any(name in sender for name in MANAGER_NAMES),
                    'is_media': '<מצורף:' in text or 'התמונה הושמטה' in text
                })

    return messages

def extract_qa_pairs(messages):
    """Extract Q&A pairs - employee question followed by Nevo's answer."""
    qa_pairs = []

    for i, msg in enumerate(messages):
        # Only process Nevo's text messages (not media)
        if not msg['is_manager'] or msg['is_media']:
            continue

        answer = msg['text']

        # Skip very short answers
        if len(answer) < 5:
            continue

        # Look back for the last employee message (the question)
        question = None
        question_sender = None
        for j in range(i-1, max(0, i-10), -1):
            prev = messages[j]
            if not prev['is_manager'] and not prev['is_media']:
                question = prev['text']
                question_sender = prev['sender']
                break

        if question and len(question) > 3:
            qa_pairs.append({
                'question': question,
                'question_sender': question_sender,
                'answer': answer,
                'date': msg['date']
            })

    return qa_pairs

def extract_instructions(messages):
    """Extract Nevo's standalone instructions/announcements."""
    instructions = []

    instruction_keywords = [
        'שימו לב', 'חשוב', 'אסור', 'מותר', 'חובה', 'צריך',
        'תזכורת', 'עדכון', 'הודעה', 'בבקשה', 'נא ', 'אל ',
        'לא לשכוח', 'חייבים'
    ]

    for msg in messages:
        if not msg['is_manager'] or msg['is_media']:
            continue

        text = msg['text']

        # Check if instruction-like
        if any(kw in text for kw in instruction_keywords) and len(text) > 20:
            instructions.append({
                'text': text,
                'date': msg['date']
            })

    return instructions

def main():
    print("Parsing chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Total messages: {len(messages)}")

    manager_msgs = [m for m in messages if m['is_manager']]
    print(f"Nevo's messages: {len(manager_msgs)}")

    print("\nExtracting Q&A pairs...")
    qa_pairs = extract_qa_pairs(messages)
    print(f"Q&A pairs: {len(qa_pairs)}")

    print("\nExtracting instructions...")
    instructions = extract_instructions(messages)
    print(f"Instructions: {len(instructions)}")

    # Build knowledge items
    knowledge_items = []

    # Add Q&A pairs
    seen_questions = set()
    for qa in qa_pairs:
        q_key = qa['question'].lower()[:50]
        if q_key in seen_questions:
            continue
        seen_questions.add(q_key)

        knowledge_items.append({
            'title': qa['question'][:100],
            'titleHe': qa['question'][:100],
            'content': f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ - מנהל): {qa['answer']}",
            'contentHe': f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ - מנהל): {qa['answer']}",
            'type': 'faq',
            'source': 'nevo_response'
        })

    # Add instructions
    seen_inst = set()
    for inst in instructions:
        i_key = inst['text'].lower()[:50]
        if i_key in seen_inst:
            continue
        seen_inst.add(i_key)

        knowledge_items.append({
            'title': inst['text'][:100],
            'titleHe': inst['text'][:100],
            'content': f"הנחיית מנהל: {inst['text']}",
            'contentHe': f"הנחיית מנהל: {inst['text']}",
            'type': 'instruction',
            'source': 'nevo_instruction'
        })

    print(f"\nTotal unique knowledge items: {len(knowledge_items)}")

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(knowledge_items, f, ensure_ascii=False, indent=2)

    print(f"Saved to {OUTPUT_FILE}")

    # Show samples
    print("\n--- Sample Q&A ---")
    for item in knowledge_items[:5]:
        if item['type'] == 'faq':
            print(f"Q: {item['title'][:60]}")
            print(f"A: {item['content'].split('תשובה')[1][:60] if 'תשובה' in item['content'] else '...'}")
            print()

if __name__ == '__main__':
    main()
