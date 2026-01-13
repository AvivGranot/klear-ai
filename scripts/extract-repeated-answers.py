#!/usr/bin/env python3
"""
Extract REPEATED ANSWERS from Nevo.
Logic: If Nevo gave the SAME answer 2+ times to similar questions,
that answer becomes automatable knowledge.

This finds answer clusters - consistent responses to recurring questions.
"""

import re
import json
from collections import defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/repeated-answers.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

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
                    'time': time,
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
    # Find Q&A pairs where employee asks, Nevo responds
    # ============================================
    qa_pairs = []
    for i, msg in enumerate(messages):
        # Find Nevo's responses
        if not msg['is_manager']:
            continue

        answer = msg['text']
        answer_is_media = msg['is_media']

        # Skip very short answers (unless media)
        if len(answer) < 3 and not answer_is_media:
            continue

        # Look back for the question that triggered this
        question = None
        question_sender = None
        for j in range(i-1, max(0, i-5), -1):
            prev = messages[j]
            if not prev['is_manager'] and not prev.get('is_media', False):
                # Skip system messages
                if 'בהמתנה' in prev['text'] or len(prev['text']) < 3:
                    continue
                question = prev['text']
                question_sender = prev['sender']
                break

        if question:
            qa_pairs.append({
                'question': question,
                'question_sender': question_sender,
                'answer': answer,
                'answer_is_media': answer_is_media,
                'date': msg['date']
            })

    print(f"Total Q&A pairs: {len(qa_pairs)}")

    # ============================================
    # Group by ANSWER - find repeated answers
    # ============================================
    answer_groups = defaultdict(list)

    for qa in qa_pairs:
        # Normalize answer for grouping
        answer_key = normalize(qa['answer'])[:80]  # First 80 chars normalized
        if len(answer_key) < 5:
            continue
        answer_groups[answer_key].append(qa)

    # Filter to answers that appeared 2+ times
    repeated_answers = {}
    for answer_key, qa_list in answer_groups.items():
        if len(qa_list) >= 2:
            repeated_answers[answer_key] = qa_list

    print(f"\nAnswers repeated 2+ times: {len(repeated_answers)}")

    # ============================================
    # Build knowledge items from repeated answers
    # ============================================
    knowledge_items = []

    for answer_key, qa_list in sorted(repeated_answers.items(), key=lambda x: -len(x[1])):
        count = len(qa_list)
        # Use the first occurrence as the canonical example
        first_qa = qa_list[0]

        # Collect all unique questions that triggered this answer
        unique_questions = list(set(qa['question'] for qa in qa_list))[:5]

        item = {
            'answer': first_qa['answer'],
            'answer_is_media': first_qa['answer_is_media'],
            'example_questions': unique_questions,
            'times_used': count,
            'last_date': max(qa['date'] for qa in qa_list)
        }
        knowledge_items.append(item)

    print(f"Knowledge items created: {len(knowledge_items)}")

    # Show top repeated answers
    print("\n=== TOP REPEATED ANSWERS ===")
    for item in knowledge_items[:20]:
        media_tag = " [MEDIA]" if item['answer_is_media'] else ""
        print(f"[{item['times_used']}x]{media_tag} A: {item['answer'][:50]}")
        print(f"    Q examples: {item['example_questions'][0][:40]}...")
        print()

    # ============================================
    # Format for knowledge base
    # ============================================
    kb_items = []
    for item in knowledge_items:
        # Create a title from the most common question pattern
        title = item['example_questions'][0][:100] if item['example_questions'] else item['answer'][:100]

        # Content includes the answer and example questions
        questions_text = "\n".join(f"- {q}" for q in item['example_questions'])
        content = f"""שאלות נפוצות:
{questions_text}

תשובת מנהל (נבו פרץ):
{item['answer']}"""

        kb_items.append({
            'title': title,
            'titleHe': title,
            'content': content,
            'contentHe': content,
            'type': 'repeated_answer',
            'source': 'manager_pattern',
            'frequency': item['times_used'],
            'is_media': item['answer_is_media'],
            'example_questions': item['example_questions']
        })

    # Save
    output = {
        'total_items': len(kb_items),
        'total_qa_pairs_analyzed': len(qa_pairs),
        'items': kb_items
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(kb_items)} repeated answer patterns to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
