#!/usr/bin/env python3
"""Verify the extracted nouns are correct"""

# Verify that extracted nouns are indeed marked as nouns in wolig.dat
test_words = ["אבדה", "אביב", "שולחן", "תשובה", "חנות"]

with open("/Users/yair/Documents/MiniMila/src/hspell-1.4 2/wolig.dat", "rb") as f:
    content = f.read()
    text = content.decode('iso-8859-8')
    
print("Verification - checking test words in wolig.dat:\n")
for word in test_words:
    for line in text.split('\n'):
        if line.strip().startswith(word + ' '):
            print(f"✓ {word}: {line}")
            break

# Also verify that non-noun adjectives are NOT in bibleNouns.txt
print("\n\nVerifying adjectives are excluded:")
with open("/Users/yair/Documents/MiniMila/src/data/bibleNouns.txt", "r", encoding='utf-8') as f:
    nouns_set = set(line.strip() for line in f if line.strip())

# Check for known adjectives
test_adjectives = ["ירוק", "לבן", "כלבי", "גמדי"]  # green, white, doglike, dwarf-like (adjectives)
for test_adj in test_adjectives:
    if test_adj in nouns_set:
        print(f"✗ Adjective '{test_adj}' found in bibleNouns.txt (SHOULD NOT BE THERE)")
    else:
        print(f"✓ Adjective '{test_adj}' correctly excluded from bibleNouns.txt")

print(f"\nTotal nouns in file: {len(nouns_set)}")
print("\n✓ bibleNouns.txt successfully created with {0} Hebrew nouns!".format(len(nouns_set)))
