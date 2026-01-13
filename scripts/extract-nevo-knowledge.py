#!/usr/bin/env python3
"""
Extract knowledge from Nevo Perets (manager) responses in WhatsApp chat.
Creates Q&A pairs where employees ask and Nevo responds.
"""

import re
import json
from pathlib import Path
from collections import defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/nevo-responses.json"

# Manager identifiers
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ", "נבו"]

# Message pattern: [date, time] sender: message
MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')

def parse_chat(filepath):
    """Parse WhatsApp chat file into list of messages."""
    messages = []
    current_message = None

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            match = MESSAGE_PATTERN.match(line)
            if match:
                if current_message:
                    messages.append(current_message)

                date, time, sender, text = match.groups()
                # Clean up invisible characters
                sender = sender.replace('\u200e', '').replace('\u200f', '').replace('\u202b', '').replace('\u202c', '').strip()
                text = text.replace('\u200e', '').replace('\u200f', '').replace('\u202b', '').replace('\u202c', '').strip()

                current_message = {
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'text': text,
                    'is_manager': any(name in sender for name in MANAGER_NAMES),
                    'has_media': '<מצורף:' in text or 'התמונה הושמטה' in text or 'סרטון' in text
                }
            elif current_message:
                # Multi-line message continuation
                current_message['text'] += '\n' + line

    if current_message:
        messages.append(current_message)

    return messages

def extract_qa_pairs(messages):
    """Extract Q&A pairs where employees ask and Nevo responds."""
    qa_pairs = []

    for i, msg in enumerate(messages):
        if not msg['is_manager']:
            continue

        # Skip system messages or media-only
        if msg['text'].startswith('בהמתנה להודעה') or msg['text'] == 'התמונה הושמטה':
            continue

        # Look for context - previous messages from employees
        context_messages = []
        for j in range(max(0, i-5), i):
            prev_msg = messages[j]
            if not prev_msg['is_manager'] and not prev_msg['text'].startswith('בהמתנה'):
                context_messages.append(prev_msg)

        # If there's a clear question or context before Nevo's response
        if context_messages:
            last_employee_msg = context_messages[-1]

            # Create Q&A pair
            qa_pair = {
                'question': last_employee_msg['text'],
                'question_sender': last_employee_msg['sender'],
                'answer': msg['text'],
                'answer_sender': msg['sender'],
                'date': msg['date'],
                'has_media': msg['has_media'],
                'context': [m['text'] for m in context_messages[-3:]] if len(context_messages) > 1 else None
            }
            qa_pairs.append(qa_pair)

    return qa_pairs

def extract_manager_media(messages):
    """Extract media files shared by the manager."""
    media_items = []

    for msg in messages:
        if not msg['is_manager']:
            continue

        if '<מצורף:' in msg['text']:
            # Extract filename
            match = re.search(r'<מצורף: ([^>]+)>', msg['text'])
            if match:
                filename = match.group(1)
                media_items.append({
                    'filename': filename,
                    'date': msg['date'],
                    'sender': msg['sender'],
                    'context': msg['text']
                })

    return media_items

def extract_standalone_instructions(messages):
    """Extract standalone instructions/announcements from manager."""
    instructions = []

    for msg in messages:
        if not msg['is_manager']:
            continue

        text = msg['text']

        # Skip short messages, system messages, media-only
        if len(text) < 20:
            continue
        if text.startswith('בהמתנה') or text == 'התמונה הושמטה':
            continue
        if '<מצורף:' in text and len(text.replace(re.search(r'<מצורף: [^>]+>', text).group() if re.search(r'<מצורף: [^>]+>', text) else '', '').strip()) < 10:
            continue

        # Check if this looks like an instruction
        instruction_indicators = ['שימו לב', 'חשוב', 'נא ', 'צריך', 'אסור', 'מותר', 'חובה', 'בבקשה', 'תזכורת', 'עדכון']
        is_instruction = any(ind in text for ind in instruction_indicators)

        if is_instruction or len(text) > 50:
            instructions.append({
                'text': text,
                'date': msg['date'],
                'sender': msg['sender'],
                'type': 'instruction'
            })

    return instructions

def main():
    print("Parsing WhatsApp chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Found {len(messages)} total messages")

    manager_messages = [m for m in messages if m['is_manager']]
    print(f"Found {len(manager_messages)} messages from Nevo Perets")

    print("\nExtracting Q&A pairs...")
    qa_pairs = extract_qa_pairs(messages)
    print(f"Found {len(qa_pairs)} Q&A pairs")

    print("\nExtracting manager media...")
    media_items = extract_manager_media(messages)
    print(f"Found {len(media_items)} media items from manager")

    print("\nExtracting standalone instructions...")
    instructions = extract_standalone_instructions(messages)
    print(f"Found {len(instructions)} standalone instructions")

    # Combine into knowledge items
    knowledge_items = []

    # Add Q&A pairs
    for qa in qa_pairs:
        if qa['answer'] and len(qa['answer']) > 5:
            knowledge_items.append({
                'title': qa['question'][:100] if qa['question'] else 'תשובת מנהל',
                'titleHe': qa['question'][:100] if qa['question'] else 'תשובת מנהל',
                'content': f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ): {qa['answer']}",
                'contentHe': f"שאלה: {qa['question']}\n\nתשובה (נבו פרץ): {qa['answer']}",
                'type': 'faq',
                'source': 'nevo_response'
            })

    # Add instructions
    for inst in instructions:
        knowledge_items.append({
            'title': inst['text'][:100],
            'titleHe': inst['text'][:100],
            'content': f"הנחיית מנהל (נבו פרץ): {inst['text']}",
            'contentHe': f"הנחיית מנהל (נבו פרץ): {inst['text']}",
            'type': 'instruction',
            'source': 'nevo_instruction'
        })

    # Save to JSON
    output = {
        'manager': 'נבו פרץ (Nevo Perets)',
        'total_messages': len(manager_messages),
        'qa_pairs_count': len(qa_pairs),
        'instructions_count': len(instructions),
        'media_count': len(media_items),
        'knowledge_items': knowledge_items,
        'media_files': media_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(knowledge_items)} knowledge items to {OUTPUT_FILE}")
    print(f"Media files list: {len(media_items)} items")

if __name__ == '__main__':
    main()
