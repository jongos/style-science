"""Collect directory-linked URLs only; never persist fetched page bodies or assets."""
import json
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent
SEEDS = [
    ('commerce', 'https://siiimple.com/category/ecommerce/'),
    ('culture', 'https://siiimple.com/category/art-culture/'),
    ('editorial', 'https://siiimple.com/category/magazine/'),
    ('software', 'https://siiimple.com/category/technology-2/'),
    ('information', 'https://siiimple.com/category/education/'),
    ('information', 'https://siiimple.com/category/news/'),
    ('software', 'https://siiimple.com/category/application/'),
    ('editorial', 'https://siiimple.com/category/blog/'),
]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.active = None

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.active = [dict(attrs).get('href', ''), '']

    def handle_data(self, data):
        if self.active is not None:
            self.active[1] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.active is not None:
            self.links.append(self.active)
            self.active = None


def main():
    if (ROOT / 'corpus.json').exists():
        raise SystemExit('Corpus frozen; do not overwrite it with a new collection.')
    records, seen_pages, log = {}, set(), []
    queue = list(SEEDS)
    while queue and len(records) < 300 and len(seen_pages) < 48:
        context, page = queue.pop(0)
        if page in seen_pages:
            continue
        seen_pages.add(page)
        try:
            request = urllib.request.Request(page, headers={'User-Agent': 'StyleScience-URL-Research/0.1'})
            with urllib.request.urlopen(request, timeout=30) as response:
                parser = Links()
                parser.feed(response.read(4_000_000).decode('utf-8', errors='replace'))
            added = 0
            for href, label in parser.links:
                target = urljoin(page, href)
                parts = urlsplit(target)
                if label.strip() == 'Visit' and parts.scheme in ('https', 'http') and 'siiimple.com' not in parts.netloc:
                    url = urlunsplit((parts.scheme, parts.netloc, parts.path or '/', '', ''))
                    domain = parts.hostname.removeprefix('www.')
                    if domain not in records and len(records) < 300:
                        records[domain] = {'id': f'W{len(records)+1:03}', 'url': url, 'sourceUrl': page, 'context': context, 'evidence': 'Directory-listed URL; target appearance and availability not verified', 'collectionDate': '2026-10-07'}
                        added += 1
                if parts.hostname == 'siiimple.com' and '/page/' in parts.path and target.startswith(page.split('/page/')[0].rstrip('/') + '/') and target not in seen_pages:
                    if label.strip().isdigit() or label.strip() in ('Next', '\u00bb', '\u2192'):
                        item = (context, target)
                        if item not in queue:
                            queue.append(item)
            log.append({'sourceUrl': page, 'added': added, 'status': 'read'})
            print(json.dumps({'page': page, 'added': added, 'total': len(records)}), flush=True)
        except Exception as error:
            log.append({'sourceUrl': page, 'status': 'error', 'error': type(error).__name__})
            print(json.dumps(log[-1]), flush=True)
        time.sleep(0.25)
    if len(records) != 300:
        raise SystemExit(f'Incomplete collection: {len(records)} distinct domains; no frozen corpus written')
    corpus = list(records.values())
    (ROOT / 'corpus.json').write_text(json.dumps(corpus, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'urls.txt').write_text('\n'.join(r['url'] for r in corpus) + '\n', encoding='utf-8')
    (ROOT / 'collection-log.json').write_text(json.dumps(log, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
