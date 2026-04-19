#!/usr/bin/env python3
"""Extract Hebrew nouns from hspell wolig.dat and create bibleNouns.txt"""

# Extract nouns from wolig.dat
nouns = set()

with open("/Users/yair/Documents/MiniMila/src/hspell-1.4 2/wolig.dat", "rb") as f:
    content = f.read()
    text = content.decode('iso-8859-8')
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        
        parts = line.split()
        if len(parts) >= 2:
            word = parts[0]
            marker = parts[1]
            
            # "ע" is the noun marker
            if marker == 'ע':
                nouns.add(word)

print(f"Total nouns extracted: {len(nouns)}")

# Save to bibleNouns.txt
sorted_nouns = sorted(list(nouns))
with open("/Users/yair/Documents/MiniMila/src/data/bibleNouns.txt", "w", encoding='utf-8') as out:
    for noun in sorted_nouns:
        out.write(noun + "\n")

print(f"File saved to /Users/yair/Documents/MiniMila/src/data/bibleNouns.txt")
print(f"Total lines written: {len(sorted_nouns)}")
print(f"\nFirst 30 nouns:")
for noun in sorted_nouns[:30]:
    print(noun)
