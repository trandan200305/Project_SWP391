import json
import re

with open(r'd:\SWP391\4PF\schema_diagram_erd.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx_rawe_start = text.find('const rawE = [')
idx_rawe_end = text.find('];\n', idx_rawe_start) + 1

rawe_json_str = text[idx_rawe_start + 13 : idx_rawe_end]
rawE = json.loads(rawe_json_str.replace("'", '"'))

print("All elements in rawE:")
for e in rawE:
    print(e)
