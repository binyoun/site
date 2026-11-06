#!/usr/bin/env python3
"""Pre-deploy checks. Exits 1 on any problem. Run locally or in CI:

    python3 scripts/check_site.py
"""
import glob, json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
errors = []


def err(msg):
    errors.append(msg)


# 1. data files parse
for f in glob.glob('data/*.json'):
    try:
        json.load(open(f))
    except Exception as e:
        err(f'{f}: invalid JSON ({e})')

# 2. internal links and images in HTML
pages = glob.glob('**/index.html', recursive=True) + ['404.html']
for f in pages:
    s = open(f).read()
    base = os.path.dirname(f)
    for m in re.finditer(r'(?:src|href)="([^"#][^"]*)"', s):
        u = m.group(1)
        if re.match(r'(https?:|mailto:|tel:|data:|javascript:|//)', u):
            continue
        p = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(base, u))
        p = p.split('#')[0].split('?')[0]
        if p and not (os.path.exists(p) or os.path.exists(os.path.join(p, 'index.html'))):
            err(f'{f}: broken reference {u}')
    if f != '404.html':
        if '<title>' not in s:
            err(f'{f}: missing <title>')
        if 'name="description"' not in s:
            err(f'{f}: missing meta description')
    if '—' in s:
        err(f'{f}: contains an em-dash (site convention: none)')
    for tag in re.findall(r'<img(?![^>]*\balt=)[^>]*>', s):
        err(f'{f}: img without alt')

# 3. image paths named in data files
for f in glob.glob('data/*.json'):
    s = open(f).read()
    if '—' in s:
        err(f'{f}: contains an em-dash')
    for u in set(re.findall(r'"((?:image|still)/[^"]+\.(?:jpg|jpeg|png|gif|webp|svg))"', s)):
        if not os.path.exists(u):
            err(f'{f}: missing image {u}')
    for u in set(re.findall(r'"(?:link|url|href)":\s*"(/[^"]*)"', s)):
        p = u.lstrip('/').split('#')[0].split('?')[0]
        if p and not (os.path.exists(p) or os.path.exists(os.path.join(p, 'index.html'))):
            err(f'{f}: broken link {u}')

# 4. sitemap matches pages
sm = set(re.findall(r'https://binyoun\.com(/[^<]*)</loc>', open('sitemap.xml').read()))
have = {'/' + os.path.dirname(f) + '/' if os.path.dirname(f) else '/' for f in pages if f.endswith('index.html')}
for u in sorted(have - sm):
    err(f'sitemap.xml: missing {u}')
for u in sorted(sm - have):
    err(f'sitemap.xml: lists non-existent page {u}')

# 5. CNAME and .nojekyll present
for f in ('CNAME', '.nojekyll'):
    if not os.path.exists(f):
        err(f'{f} is missing')

if errors:
    print('\n'.join(errors))
    print(f'\n{len(errors)} problem(s)')
    sys.exit(1)
print('site checks passed')
