#!/usr/bin/env python3
"""
Find the most repetitive Q&A patterns from WhatsApp chat.
Identify frequently asked questions and common answers.
"""

import re
import json
from collections import Counter, defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/top-repetitive.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

def clean_text(text):
    text = re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()
    return text

def normalize_text(text):
    """Normalize text for comparison."""
    text = clean_text(text).lower()
    # Remove punctuation
    text = re.sub(r'[?.!,\-\'"()]', '', text)
    # Remove extra spaces
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
                    'sender': sender,
                    'text': text,
                    'is_manager': any(name in sender for name in MANAGER_NAMES),
                    'is_media': '<מצורף:' in text or 'התמונה הושמטה' in text
                })
    return messages

def main():
    print("Parsing chat...")
    messages = parse_chat(CHAT_FILE)

    # Count employee questions (non-manager, non-media)
    question_counter = Counter()
    question_examples = defaultdict(list)

    for msg in messages:
        if msg['is_manager'] or msg['is_media']:
            continue
        text = msg['text']
        if len(text) < 5 or len(text) > 200:
            continue

        normalized = normalize_text(text)
        if len(normalized) < 5:
            continue

        question_counter[normalized] += 1
        if len(question_examples[normalized]) < 3:
            question_examples[normalized].append(text)

    # Count manager answers
    answer_counter = Counter()
    answer_examples = defaultdict(list)

    for msg in messages:
        if not msg['is_manager'] or msg['is_media']:
            continue
        text = msg['text']
        if len(text) < 5 or len(text) > 300:
            continue

        normalized = normalize_text(text)
        if len(normalized) < 5:
            continue

        answer_counter[normalized] += 1
        if len(answer_examples[normalized]) < 3:
            answer_examples[normalized].append(text)

    print(f"\n=== TOP REPEATED QUESTIONS (by employees) ===")
    top_questions = []
    for q, count in question_counter.most_common(30):
        if count >= 2:
            example = question_examples[q][0]
            print(f"[{count}x] {example[:60]}")
            top_questions.append({
                'text': example,
                'normalized': q,
                'count': count
            })

    print(f"\n=== TOP REPEATED ANSWERS (by Nevo) ===")
    top_answers = []
    for a, count in answer_counter.most_common(30):
        if count >= 2:
            example = answer_examples[a][0]
            print(f"[{count}x] {example[:60]}")
            top_answers.append({
                'text': example,
                'normalized': a,
                'count': count
            })

    # Find Q&A pairs where both are repeated
    print(f"\n=== BUILDING TOP Q&A PAIRS ===")

    qa_pairs = []
    seen = set()

    # For each top question, find what Nevo typically answers
    for i, msg in enumerate(messages):
        if msg['is_manager'] or msg['is_media']:
            continue

        q_text = msg['text']
        q_norm = normalize_text(q_text)

        # Check if this is a frequently asked question
        if question_counter[q_norm] < 2:
            continue

        # Look for Nevo's response
        for j in range(i+1, min(i+10, len(messages))):
            next_msg = messages[j]
            if next_msg['is_manager'] and not next_msg['is_media']:
                a_text = next_msg['text']
                a_norm = normalize_text(a_text)

                # Create unique key
                pair_key = f"{q_norm[:30]}|{a_norm[:30]}"
                if pair_key in seen:
                    continue
                seen.add(pair_key)

                qa_pairs.append({
                    'question': q_text,
                    'answer': a_text,
                    'q_count': question_counter[q_norm],
                    'a_count': answer_counter[a_norm],
                    'relevance_score': question_counter[q_norm] + answer_counter[a_norm]
                })
                break

    # Sort by relevance (most repeated)
    qa_pairs.sort(key=lambda x: x['relevance_score'], reverse=True)

    # Take top 50 most relevant
    top_qa = qa_pairs[:50]

    print(f"\nTop {len(top_qa)} most relevant Q&A pairs:")
    for qa in top_qa[:15]:
        print(f"  [{qa['q_count']}x Q, {qa['a_count']}x A] Q: {qa['question'][:40]}... A: {qa['answer'][:30]}...")

    # Save results
    output = {
        'top_questions': top_questions[:20],
        'top_answers': top_answers[:20],
        'top_qa_pairs': top_qa,
        'stats': {
            'unique_questions_repeated': len([q for q, c in question_counter.items() if c >= 2]),
            'unique_answers_repeated': len([a for a, c in answer_counter.items() if c >= 2]),
            'total_qa_pairs': len(top_qa)
        }
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
