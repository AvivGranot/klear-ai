#!/usr/bin/env python3
"""
Extract ALL repeated patterns from Nevo:
1. Repeated TEXT answers (same text 2+ times)
2. Repeated MEDIA (same image/file shared 2+ times)
3. Filter out greetings and noise
"""

import re
import json
from collections import defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/automation-knowledge.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

# Filter these out - not useful for automation
NOISE_ANSWERS = [
    'שבת שלום', 'שבוע טוב', 'בוקר טוב', 'ערב טוב',
    'תודה', 'בבקשה', 'אמן', 'מחקת את ההודעה',
    'חחח', 'הההה', 'ok', 'אוקיי', 'סבבה',
    'my car'  # Seems like an error
]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def normalize(text):
    text = clean_text(text).lower()
    text = re.sub(r'[?.!,\-\'\"()]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_noise(text):
    """Check if answer is noise/greeting."""
    text_lower = normalize(text)
    if len(text_lower) < 5:
        return True
    for noise in NOISE_ANSWERS:
        if text_lower.startswith(noise.lower()) or text_lower == noise.lower():
            return True
    return False

def extract_media_filename(text):
    """Extract media filename from attachment text."""
    match = re.search(r'<מצורף: ([^>]+)>', text)
    if match:
        return match.group(1)
    return None

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

                is_media = '<מצורף:' in text or 'התמונה הושמטה' in text
                media_file = extract_media_filename(text) if is_media else None

                messages.append({
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'text': text,
                    'is_manager': any(name in sender for name in MANAGER_NAMES),
                    'is_media': is_media,
                    'media_file': media_file
                })
    return messages

def main():
    print("Parsing chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Total messages: {len(messages)}")

    # ============================================
    # Collect Nevo's responses with context
    # ============================================
    nevo_responses = []

    for i, msg in enumerate(messages):
        if not msg['is_manager']:
            continue

        answer = msg['text']

        # Look back for the triggering question
        question = None
        question_sender = None
        for j in range(i-1, max(0, i-5), -1):
            prev = messages[j]
            if not prev['is_manager']:
                if 'בהמתנה' in prev['text'] or len(prev['text']) < 3:
                    continue
                question = prev['text']
                question_sender = prev['sender']
                break

        nevo_responses.append({
            'answer': answer,
            'is_media': msg['is_media'],
            'media_file': msg['media_file'],
            'question': question,
            'question_sender': question_sender,
            'date': msg['date']
        })

    print(f"Nevo's responses: {len(nevo_responses)}")

    # ============================================
    # Group by answer (text or media filename)
    # ============================================
    answer_groups = defaultdict(list)

    for resp in nevo_responses:
        if resp['is_media'] and resp['media_file']:
            # Group by media filename
            key = f"MEDIA:{resp['media_file']}"
        else:
            # Group by normalized text
            key = normalize(resp['answer'])[:80]

        if len(key) < 5:
            continue

        answer_groups[key].append(resp)

    # Filter to repeated answers (2+ times)
    repeated = {k: v for k, v in answer_groups.items() if len(v) >= 2}

    print(f"\nRepeated patterns (2+ times): {len(repeated)}")

    # ============================================
    # Build knowledge items, filtering noise
    # ============================================
    knowledge_items = []

    for answer_key, responses in sorted(repeated.items(), key=lambda x: -len(x[1])):
        first = responses[0]
        count = len(responses)

        # Filter noise for text answers
        if not first['is_media'] and is_noise(first['answer']):
            print(f"  Skipping noise: {first['answer'][:30]}")
            continue

        # Collect unique questions that triggered this
        questions = list(set(r['question'] for r in responses if r['question']))[:5]

        # Determine type
        if first['is_media']:
            answer_type = 'media'
            display_answer = f"[קובץ: {first['media_file']}]"
        else:
            answer_type = 'text'
            display_answer = first['answer']

        item = {
            'answer': first['answer'],
            'answer_display': display_answer,
            'type': answer_type,
            'media_file': first['media_file'],
            'example_questions': questions,
            'times_used': count,
            'last_date': max(r['date'] for r in responses)
        }
        knowledge_items.append(item)

    print(f"\nUseful knowledge items: {len(knowledge_items)}")

    # Show results
    print("\n=== AUTOMATION KNOWLEDGE ===")
    for item in knowledge_items:
        type_tag = f"[{item['type'].upper()}]"
        print(f"{type_tag} [{item['times_used']}x] {item['answer_display'][:50]}")
        if item['example_questions']:
            print(f"    Triggers: {item['example_questions'][0][:40]}...")
        print()

    # ============================================
    # Format for knowledge base
    # ============================================
    kb_items = []
    for item in knowledge_items:
        title = item['example_questions'][0][:100] if item['example_questions'] else item['answer'][:100]

        questions_text = "\n".join(f"- {q}" for q in item['example_questions']) if item['example_questions'] else "N/A"

        content = f"""שאלות שהפעילו תשובה זו:
{questions_text}

תשובת מנהל (נבו פרץ):
{item['answer_display']}"""

        kb_items.append({
            'title': title,
            'titleHe': title,
            'content': content,
            'contentHe': content,
            'type': 'repeated_answer',
            'answer_type': item['type'],
            'source': 'automation_pattern',
            'frequency': item['times_used'],
            'media_file': item['media_file'],
            'example_questions': item['example_questions'],
            'raw_answer': item['answer']
        })

    # Save
    output = {
        'description': 'Repeated answers from Nevo that can be automated',
        'total_items': len(kb_items),
        'text_patterns': len([i for i in kb_items if i['answer_type'] == 'text']),
        'media_patterns': len([i for i in kb_items if i['answer_type'] == 'media']),
        'items': kb_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
