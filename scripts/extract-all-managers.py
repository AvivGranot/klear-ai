#!/usr/bin/env python3
"""
Extract repeated answers from ALL managers:
- Nevo Perets / נבו פרץ
- Hila Peretz / הילה פרץ
- Sari Peretz / שרי פרץ
- Yeshi Peretz / ישי פרץ

Also track associated media files.
"""

import re
import json
from collections import defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/automation-knowledge.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')

# All managers
MANAGERS = {
    "nevo": ["Nevo Perets", "נבו פרץ", "נבו"],
    "hila": ["Hila Peretz", "הילה פרץ", "הילה"],
    "sari": ["Sari Peretz", "שרי פרץ", "שרי"],
    "yeshi": ["Yeshi Peretz", "ישי פרץ", "ישי"],
}

# Flatten for matching
ALL_MANAGER_NAMES = []
for names in MANAGERS.values():
    ALL_MANAGER_NAMES.extend(names)

# Noise patterns to filter
NOISE_ANSWERS = [
    'שבת שלום', 'שבוע טוב', 'בוקר טוב', 'ערב טוב', 'לילה טוב',
    'תודה', 'בבקשה', 'אמן', 'מחקת את ההודעה',
    'חחח', 'הההה', 'ok', 'אוקיי', 'סבבה', 'מצויין',
    'my car', 'שלום', 'היי'
]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

def normalize(text):
    text = clean_text(text).lower()
    text = re.sub(r'[?.!,\-\'\"()]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_noise(text):
    text_lower = normalize(text)
    if len(text_lower) < 5:
        return True
    for noise in NOISE_ANSWERS:
        if text_lower.startswith(noise.lower()) or text_lower == noise.lower():
            return True
    return False

def get_manager_id(sender):
    """Get manager ID from sender name."""
    sender_clean = clean_text(sender)
    for manager_id, names in MANAGERS.items():
        if any(name in sender_clean for name in names):
            return manager_id
    return None

def get_manager_display_name(manager_id):
    """Get display name for manager."""
    names = {
        "nevo": "נבו פרץ",
        "hila": "הילה פרץ",
        "sari": "שרי פרץ",
        "yeshi": "ישי פרץ",
    }
    return names.get(manager_id, "מנהל")

def extract_media_info(text):
    """Extract media filename and type from message."""
    if '<מצורף:' in text:
        match = re.search(r'<מצורף: ([^>]+)>', text)
        if match:
            filename = match.group(1)
            # Determine media type
            ext = filename.split('.')[-1].lower() if '.' in filename else ''
            media_type = 'image' if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else \
                         'video' if ext in ['mp4', 'mov', 'avi'] else \
                         'document' if ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx'] else 'file'
            return {'filename': filename, 'type': media_type}
    if 'התמונה הושמטה' in text:
        return {'filename': None, 'type': 'image_removed'}
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

                manager_id = get_manager_id(sender)
                media_info = extract_media_info(text)

                messages.append({
                    'date': date,
                    'time': time,
                    'sender': sender,
                    'text': text,
                    'is_manager': manager_id is not None,
                    'manager_id': manager_id,
                    'is_media': media_info is not None,
                    'media_info': media_info
                })
    return messages

def main():
    print("Parsing chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Total messages: {len(messages)}")

    # Count messages per manager
    manager_counts = defaultdict(int)
    for msg in messages:
        if msg['manager_id']:
            manager_counts[msg['manager_id']] += 1

    print("\nMessages per manager:")
    for manager_id, count in sorted(manager_counts.items(), key=lambda x: -x[1]):
        print(f"  {get_manager_display_name(manager_id)}: {count}")

    # ============================================
    # Collect manager responses with context
    # ============================================
    manager_responses = []

    for i, msg in enumerate(messages):
        if not msg['is_manager']:
            continue

        answer = msg['text']
        manager_id = msg['manager_id']

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

        # Look for associated media in nearby messages from same manager
        associated_media = []
        # Check current message
        if msg['media_info']:
            associated_media.append(msg['media_info'])
        # Check next few messages from same manager
        for j in range(i+1, min(i+3, len(messages))):
            next_msg = messages[j]
            if next_msg['manager_id'] == manager_id and next_msg['media_info']:
                associated_media.append(next_msg['media_info'])
            elif next_msg['is_manager'] and next_msg['manager_id'] != manager_id:
                break  # Different manager responded

        manager_responses.append({
            'answer': answer,
            'manager_id': manager_id,
            'manager_name': get_manager_display_name(manager_id),
            'is_media': msg['is_media'],
            'media_info': msg['media_info'],
            'associated_media': associated_media,
            'question': question,
            'question_sender': question_sender,
            'date': msg['date']
        })

    print(f"\nTotal manager responses: {len(manager_responses)}")

    # ============================================
    # Group by answer (text or media filename)
    # ============================================
    answer_groups = defaultdict(list)

    for resp in manager_responses:
        if resp['is_media'] and resp['media_info'] and resp['media_info'].get('filename'):
            # Group by media filename
            key = f"MEDIA:{resp['media_info']['filename']}"
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
    # Build knowledge items by manager
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

        # Collect all associated media
        all_media = []
        for r in responses:
            if r['associated_media']:
                for m in r['associated_media']:
                    if m and m.get('filename') and m['filename'] not in [am.get('filename') for am in all_media]:
                        all_media.append(m)

        # Determine type
        if first['is_media'] and first['media_info']:
            answer_type = first['media_info'].get('type', 'media')
            display_answer = f"[קובץ: {first['media_info'].get('filename', 'מדיה')}]"
        else:
            answer_type = 'text'
            display_answer = first['answer']

        # Get manager info
        manager_id = first['manager_id']
        manager_name = first['manager_name']

        # Check if all responses are from same manager
        manager_ids = set(r['manager_id'] for r in responses)
        if len(manager_ids) > 1:
            manager_name = "מנהלים שונים"

        item = {
            'answer': first['answer'],
            'answer_display': display_answer,
            'type': answer_type,
            'manager_id': manager_id,
            'manager_name': manager_name,
            'media_info': first['media_info'],
            'associated_media': all_media[:3],  # Limit to 3 media files
            'example_questions': questions,
            'times_used': count,
            'last_date': max(r['date'] for r in responses),
            'status': 'pending_approval'  # All start as pending
        }
        knowledge_items.append(item)

    print(f"\nUseful knowledge items: {len(knowledge_items)}")

    # Show results by manager
    print("\n=== AUTOMATION PATTERNS BY MANAGER ===")
    by_manager = defaultdict(list)
    for item in knowledge_items:
        by_manager[item['manager_name']].append(item)

    for manager, items in sorted(by_manager.items(), key=lambda x: -len(x[1])):
        print(f"\n{manager} ({len(items)} patterns):")
        for item in items[:5]:
            media_tag = f" [+{len(item['associated_media'])} media]" if item['associated_media'] else ""
            print(f"  [{item['times_used']}x]{media_tag} {item['answer_display'][:50]}")

    # ============================================
    # Format for knowledge base
    # ============================================
    kb_items = []
    for item in knowledge_items:
        title = item['example_questions'][0][:100] if item['example_questions'] else item['answer'][:100]

        questions_text = "\n".join(f"- {q}" for q in item['example_questions']) if item['example_questions'] else "N/A"

        content = f"""שאלות שהפעילו תשובה זו:
{questions_text}

תשובת מנהל ({item['manager_name']}):
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
            'manager_id': item['manager_id'],
            'manager_name': item['manager_name'],
            'media_info': item['media_info'],
            'associated_media': item['associated_media'],
            'example_questions': item['example_questions'],
            'raw_answer': item['answer'],
            'status': item['status']
        })

    # Save
    output = {
        'description': 'Repeated answers from managers that can be automated',
        'total_items': len(kb_items),
        'by_manager': {m: len([i for i in kb_items if i['manager_name'] == m]) for m in set(i['manager_name'] for i in kb_items)},
        'text_patterns': len([i for i in kb_items if i['answer_type'] == 'text']),
        'media_patterns': len([i for i in kb_items if i['answer_type'] != 'text']),
        'items': kb_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
