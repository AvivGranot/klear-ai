#!/usr/bin/env python3
"""
Build final knowledge base:
- Keep documents (90 items)
- Add Nevo's operational knowledge (90 items)
"""

import json

EXISTING_FILE = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"
NEVO_FILE = "/Users/avivgranot/klear-ai/src/data/nevo-operational.json"
OUTPUT_FILE = "/Users/avivgranot/klear-ai/src/data/whatsapp-faqs.json"

def main():
    # Load existing data
    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    print(f"Existing items: {len(existing)}")

    # Count by type
    types = {}
    for item in existing:
        t = item.get('type', 'unknown')
        types[t] = types.get(t, 0) + 1
    print(f"By type: {types}")

    # Keep only documents
    documents = [item for item in existing if item.get('type') == 'document']
    print(f"Keeping {len(documents)} documents")

    # Load Nevo's operational knowledge
    with open(NEVO_FILE, 'r', encoding='utf-8') as f:
        nevo_data = json.load(f)

    nevo_items = nevo_data['items']
    print(f"Adding {len(nevo_items)} items from Nevo")

    # Combine
    final_kb = documents + nevo_items

    print(f"\nFinal knowledge base: {len(final_kb)} items")
    print(f"  - Documents: {len(documents)}")
    print(f"  - Nevo operational: {len(nevo_items)}")

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_kb, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
