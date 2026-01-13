#!/usr/bin/env python3
"""
Build final data structure:
1. all-conversations.json - ALL Q&A for analytics (including noise)
2. whatsapp-faqs.json - Automation knowledge + documents for Knowledge page
"""

import re
import json
from collections import defaultdict

CHAT_FILE = "/Users/avivgranot/Desktop/Klear-ai/WhatsApp Chat - צוות אמיר בני ברק/_chat.txt"
AUTOMATION_FILE = "/Users/avivgranot/klear-ai/src/data/automation-knowledge.json"
EXISTING_KB = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"
OUTPUT_CONVERSATIONS = "/Users/avivgranot/klear-ai/src/data/all-conversations.json"
OUTPUT_KNOWLEDGE = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"

MESSAGE_PATTERN = re.compile(r'\[(\d+\.\d+\.\d+), (\d+:\d+:\d+)\] ([^:]+): (.+)')
MANAGER_NAMES = ["Nevo Perets", "נבו פרץ"]

def clean_text(text):
    return re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text).strip()

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
    print("=" * 50)
    print("BUILDING FINAL DATA STRUCTURE")
    print("=" * 50)

    # Parse chat
    print("\nParsing chat...")
    messages = parse_chat(CHAT_FILE)
    print(f"Total messages: {len(messages)}")

    # ============================================
    # 1. ALL CONVERSATIONS for Analytics
    # ============================================
    print("\n--- Building ALL CONVERSATIONS ---")

    all_qa = []
    for i, msg in enumerate(messages):
        if not msg['is_manager']:
            continue

        answer = msg['text']

        # Find the question
        question = None
        question_sender = None
        for j in range(i-1, max(0, i-5), -1):
            prev = messages[j]
            if not prev['is_manager']:
                if 'בהמתנה' in prev['text']:
                    continue
                question = prev['text']
                question_sender = prev['sender']
                break

        all_qa.append({
            'id': f'conv-{len(all_qa)+1}',
            'question': question or '',
            'questionSender': question_sender or 'Unknown',
            'answer': answer,
            'answerSender': msg['sender'],
            'date': msg['date'],
            'time': msg['time'],
            'isMedia': msg['is_media']
        })

    print(f"Total conversations: {len(all_qa)}")

    # Save conversations
    conversations_output = {
        'total': len(all_qa),
        'conversations': all_qa
    }
    with open(OUTPUT_CONVERSATIONS, 'w', encoding='utf-8') as f:
        json.dump(conversations_output, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_CONVERSATIONS}")

    # ============================================
    # 2. KNOWLEDGE BASE (Automation + Documents)
    # ============================================
    print("\n--- Building KNOWLEDGE BASE ---")

    # Load existing KB to get documents
    with open(EXISTING_KB, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    # Get documents only
    documents = [item for item in existing if item.get('type') == 'document']
    print(f"Documents from existing KB: {len(documents)}")

    # Load automation knowledge
    with open(AUTOMATION_FILE, 'r', encoding='utf-8') as f:
        automation = json.load(f)

    automation_items = automation['items']
    print(f"Automation patterns: {len(automation_items)}")

    # Combine
    knowledge_items = documents + automation_items
    print(f"Total knowledge items: {len(knowledge_items)}")

    # Save knowledge base
    with open(OUTPUT_KNOWLEDGE, 'w', encoding='utf-8') as f:
        json.dump(knowledge_items, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUTPUT_KNOWLEDGE}")

    # ============================================
    # Summary
    # ============================================
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"\nAnalytics (all-conversations.json):")
    print(f"  - {len(all_qa)} total Q&A pairs (including all noise)")

    print(f"\nKnowledge Base (whatsapp-faqs.json):")
    print(f"  - {len(documents)} documents (uploaded files)")
    print(f"  - {len(automation_items)} automation patterns (repeated answers)")
    print(f"  - {len(knowledge_items)} total items")

    print("\nAutomation patterns:")
    for item in automation_items:
        freq = item.get('frequency', 1)
        answer = item.get('raw_answer', item.get('title', ''))[:40]
        print(f"  [{freq}x] {answer}")

if __name__ == '__main__':
    main()
