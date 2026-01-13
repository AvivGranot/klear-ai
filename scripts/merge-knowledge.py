#!/usr/bin/env python3
"""
Merge existing FAQs with Nevo's responses into a single knowledge base.
Clean up data and remove duplicates.
"""

import json
import re
from pathlib import Path

EXISTING_FILE = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"
NEVO_FILE = "/Users/avivgranot/klear-ai/src/data/nevo-responses.json"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"

def clean_text(text):
    """Clean up message text."""
    if not text:
        return ""

    # Remove invisible Unicode characters
    text = re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', text)

    # Remove media references that aren't useful
    text = re.sub(r'<מצורף: [^>]+>', '[תמונה]', text)
    text = re.sub(r'התמונה הושמטה', '[תמונה]', text)
    text = re.sub(r'הסרטון הושמט', '[סרטון]', text)

    # Remove timestamp lines embedded in content
    text = re.sub(r'\[\d+\.\d+\.\d+, \d+:\d+:\d+\] [^:]+: ', '\n', text)

    # Clean up multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()

def is_valid_qa(item):
    """Check if Q&A item is valid and useful."""
    title = item.get('titleHe', '') or item.get('title', '')
    content = item.get('contentHe', '') or item.get('content', '')

    # Skip very short items
    if len(title) < 5 or len(content) < 10:
        return False

    # Skip items that are just system messages
    if 'בהמתנה להודעה' in title or 'הודעה זו נמחקה' in title:
        return False

    # Skip items that are just URLs without context
    if title.startswith('http') and len(title) < 100:
        return False

    return True

def main():
    # Load existing FAQs
    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        existing_items = json.load(f)

    print(f"Existing items: {len(existing_items)}")

    # Load Nevo's responses
    with open(NEVO_FILE, 'r', encoding='utf-8') as f:
        nevo_data = json.load(f)

    nevo_items = nevo_data.get('knowledge_items', [])
    print(f"Nevo's items: {len(nevo_items)}")

    # Clean and filter Nevo's items
    cleaned_nevo = []
    for item in nevo_items:
        # Clean the text
        item['title'] = clean_text(item.get('title', ''))[:100]
        item['titleHe'] = clean_text(item.get('titleHe', ''))[:100]
        item['content'] = clean_text(item.get('content', ''))
        item['contentHe'] = clean_text(item.get('contentHe', ''))

        if is_valid_qa(item):
            cleaned_nevo.append(item)

    print(f"Valid Nevo items after cleaning: {len(cleaned_nevo)}")

    # Create a set of existing titles for dedup
    existing_titles = set()
    for item in existing_items:
        title = (item.get('titleHe', '') or item.get('title', '')).lower()[:50]
        existing_titles.add(title)

    # Add new unique items
    added = 0
    for item in cleaned_nevo:
        title = (item.get('titleHe', '') or item.get('title', '')).lower()[:50]
        if title not in existing_titles:
            existing_items.append(item)
            existing_titles.add(title)
            added += 1

    print(f"Added {added} new unique items from Nevo")
    print(f"Total items: {len(existing_items)}")

    # Count by type
    type_counts = {}
    for item in existing_items:
        t = item.get('type', 'unknown')
        type_counts[t] = type_counts.get(t, 0) + 1

    print(f"\nBy type:")
    for t, count in sorted(type_counts.items()):
        print(f"  {t}: {count}")

    # Save merged data
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(existing_items, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
