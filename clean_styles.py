import os
from bs4 import BeautifulSoup
import re

files_to_clean = ["availability.html", "cv.html", "index.html"]
css_file = "src/style/utilities.css"

# A basic map of style -> class name
style_to_class = {}
class_to_style = {}
class_counter = 1

def style_to_dict(style_str):
    if not style_str: return {}
    d = {}
    for rule in style_str.split(';'):
        if ':' in rule:
            k, v = rule.split(':', 1)
            d[k.strip()] = v.strip()
    return d

def normalize_style(style_str):
    d = style_to_dict(style_str)
    # Sort keys for deterministic matching
    return '; '.join(f"{k}: {d[k]}" for k in sorted(d.keys())) + ';'

def generate_class_name(style_str):
    global class_counter
    d = style_to_dict(style_str)
    
    # Try to make semantic names
    parts = []
    if 'display' in d and d['display'] == 'flex':
        parts.append('flex')
        if d.get('flex-direction') == 'column':
            parts.append('col')
        else:
            parts.append('row')
        if 'align-items' in d:
            parts.append(f"items-{d['align-items']}")
        if 'justify-content' in d:
            parts.append(f"justify-{d['justify-content']}")
    
    if 'width' in d and 'height' in d and 'px' in d['width']:
        parts.append(f"size-{d['width'].replace('px', '')}")
    elif 'font-size' in d:
        fs = d['font-size'].replace('.', '_').replace('rem', 'rem').replace('px', 'px')
        parts.append(f"text-{fs}")
        if 'color' in d and 'var(' in d['color']:
            var_name = re.search(r'var\(--([^)]+)\)', d['color']).group(1)
            parts.append(f"color-{var_name}")
            
    if not parts:
        name = f"util-style-{class_counter}"
        class_counter += 1
        return name
        
    name = "-".join(parts)
    # Ensure it's unique
    base_name = name
    idx = 1
    while base_name in class_to_style and class_to_style[base_name] != normalize_style(style_str):
        base_name = f"{name}-{idx}"
        idx += 1
    return base_name

for filepath in files_to_clean:
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
        
    # BeautifulSoup might mess up the indentation or structure (like un-closing tags).
    # Since these are simple files, let's use regex to find and replace to preserve formatting exactly.
    # We will find `style="..."`
    
    def repl(match):
        style_val = match.group(1)
        norm = normalize_style(style_val)
        if norm not in style_to_class:
            cls_name = generate_class_name(style_val)
            style_to_class[norm] = cls_name
            class_to_style[cls_name] = norm
        
        cls_name = style_to_class[norm]
        # We need to add this class to the element.
        # But wait, regex replace of just `style="..."` doesn't let us easily add to `class="..."` if it exists.
        # So we just replace `style="..."` with `class="{cls_name} "` and let a subsequent pass merge classes?
        # Better yet, use beautifulsoup to parse, find styles, generate map, then use regex string replacement on the raw HTML to carefully inject classes and remove styles without breaking formatting.
        return "" # we will do this better
        
    # We'll use BeautifulSoup just to extract all styles safely
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup.find_all(style=True):
        style_val = tag['style']
        norm = normalize_style(style_val)
        if norm not in style_to_class:
            cls_name = generate_class_name(style_val)
            style_to_class[norm] = cls_name
            class_to_style[cls_name] = norm

# Now apply carefully using regex
for filepath in files_to_clean:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find all <tag ... style="..." ... >
    # This is tricky with regex. Let's do it with bs4 and if the output is clean, we use it. 
    # bs4 can alter formatting of empty tags.
    # Let's write a simple state machine parser instead for safety.
    
    def process_html(text):
        new_text = ""
        in_tag = False
        i = 0
        while i < len(text):
            if text[i] == '<' and i+1 < len(text) and text[i+1] not in ('/', '!', '?'):
                # Start of tag
                tag_start = i
                in_quote = False
                quote_char = ''
                # Find end of tag
                j = i + 1
                while j < len(text):
                    if text[j] in ('"', "'"):
                        if not in_quote:
                            in_quote = True
                            quote_char = text[j]
                        elif quote_char == text[j]:
                            in_quote = False
                    elif text[j] == '>' and not in_quote:
                        break
                    j += 1
                
                tag_content = text[tag_start:j+1]
                
                # Check if it has style
                style_match = re.search(r'style\s*=\s*(["\'])(.*?)\1', tag_content, flags=re.IGNORECASE | re.DOTALL)
                if style_match:
                    style_val = style_match.group(2)
                    norm = normalize_style(style_val)
                    if norm in style_to_class:
                        cls_name = style_to_class[norm]
                        # Remove style attribute
                        tag_content = tag_content[:style_match.start()] + tag_content[style_match.end():]
                        
                        # Add class
                        class_match = re.search(r'class\s*=\s*(["\'])(.*?)\1', tag_content, flags=re.IGNORECASE)
                        if class_match:
                            existing_classes = class_match.group(2)
                            new_classes = existing_classes + " " + cls_name
                            tag_content = tag_content[:class_match.start(2)] + new_classes + tag_content[class_match.end(2):]
                        else:
                            # Insert class after tag name
                            space_idx = tag_content.find(' ')
                            if space_idx == -1 or space_idx > tag_content.find('>'):
                                space_idx = tag_content.find('>')
                                if tag_content[space_idx-1] == '/':
                                    space_idx -= 1
                            tag_content = tag_content[:space_idx] + f' class="{cls_name}"' + tag_content[space_idx:]
                new_text += tag_content
                i = j + 1
            else:
                new_text += text[i]
                i += 1
        return new_text
        
    cleaned = process_html(content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(cleaned)

# Generate CSS
css_content = "/* Auto-generated utility classes from inline styles */\n\n"
for cls, style in class_to_style.items():
    css_content += f".{cls} {{\n"
    for rule in style.split(';'):
        if rule.strip():
            css_content += f"    {rule.strip()};\n"
    css_content += "}\n\n"

with open(css_file, 'w', encoding='utf-8') as f:
    f.write(css_content)

print(f"Extracted {len(style_to_class)} unique inline styles to {css_file}")
