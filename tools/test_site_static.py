"""Dependency-free site artifact checks, not rendered/browser validation."""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

SITE = Path(__file__).resolve().parents[1] / 'site'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.tags, self.text = [], [], [], []
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.refs.append(attrs[key])

    def handle_data(self, data):
        self.text.append(data)


def check_references(page, root):
    root = root.resolve()
    assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML ids'
    for reference in page.refs:
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            continue  # Remote availability is outside this offline check.
        if url.path:
            target = (root / unquote(url.path)).resolve()
            assert target.is_relative_to(root), f'Reference escapes site: {reference}'
            assert target.is_file() and target.stat().st_size, f'Missing/empty asset: {reference}'
        elif url.fragment:
            assert unquote(url.fragment) in page.ids, f'Missing anchor: {reference}'


def check_markdown_references(source, directory, root):
    """Check inline and reference-style file links in the authored Markdown subset."""
    references = re.findall(r'\]\(<?([^\s)>]+)>?(?:\s+"[^"\n]*")?\)', source)
    references += re.findall(r'^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?', source, re.MULTILINE)
    root = root.resolve()
    repo_prefix = 'https://github.com/jongos/style-science/blob/main/'
    for reference in references:
        url = urlsplit(reference)
        if reference.startswith(repo_prefix):
            target = (SITE.parent / unquote(url.path.split('/blob/main/', 1)[1])).resolve()
            assert target.is_relative_to(SITE.parent), f'Repository link escapes root: {reference}'
            assert target.is_file(), f'Missing repository target: {reference}'
        elif not url.scheme and not url.netloc and url.path:
            target = (directory / unquote(url.path)).resolve()
            assert target.is_relative_to(root), f'Markdown link escapes site: {reference}'
            assert target.is_file() and target.stat().st_size, f'Missing Markdown asset: {reference}'


class StaticSiteTests(unittest.TestCase):
    def test_built_content_and_references(self):
        page = Page((SITE / 'index.html').read_text(encoding='utf-8'))
        manifesto = json.loads((SITE / 'manifesto.json').read_text(encoding='utf-8'))
        text = ' '.join(page.text)
        markdown = (SITE / 'manifesto.md').read_text(encoding='utf-8')
        check_references(page, SITE)
        self.assertEqual(sum(tag == 'h1' for tag, _ in page.tags), 1)
        self.assertEqual(sum('principle' in a.get('class', '').split() for _, a in page.tags), len(manifesto['principles']))
        for principle in manifesto['principles']:
            for key in ('title', 'body'):
                self.assertIn(principle[key], text)
                self.assertIn(principle[key], markdown)
        for key in ('introduction', 'position', 'researchAcknowledgment', 'closing', 'pledge'):
            self.assertIn(manifesto[key], text)
            self.assertIn(manifesto[key], markdown)
        self.assertTrue(any(tag == 'html' and a.get('lang') == 'en' for tag, a in page.tags))
        self.assertTrue(any(tag == 'meta' and a.get('name') == 'viewport' for tag, a in page.tags))
        for control in ('structure', 'expression'):
            self.assertTrue(any(tag == 'label' and a.get('for') == control for tag, a in page.tags))
            self.assertTrue(any(tag == 'input' and a.get('id') == control and a.get('type') == 'range' for tag, a in page.tags))
        self.assertEqual(sum('data-point' in a for _, a in page.tags), 48)
        self.assertEqual(sum('data-value' in a for _, a in page.tags), 8)
        self.assertIn('sample-prompt', page.ids)
        self.assertTrue((SITE / 'fonts/LICENSE.txt').read_text(encoding='utf-8').strip())
        self.assertEqual((SITE / 'related-work.md').read_text(encoding='utf-8'),
                         re.sub(r'\]\(([^()\s]+)\)', lambda m: m[0] if re.match(r'(?:[a-z][a-z\d+.-]*:|//|#)', m[1], re.I)
                                else '](https://github.com/jongos/style-science/blob/main/' + m[1].removeprefix('./') + ')',
                                (SITE.parent / 'RELATED-WORK.md').read_text(encoding='utf-8')))

    def test_built_markdown_file_links(self):
        for path in SITE.rglob('*.md'):
            with self.subTest(path=path.relative_to(SITE)):
                check_markdown_references(path.read_text(encoding='utf-8'), path.parent, SITE)

    def test_missing_markdown_targets_fail(self):
        for source in ('[plan](evaluation/MATHEMATICAL-RESEARCH-PLAN.md)',
                       '[plan][research]\n[research]: evaluation/MATHEMATICAL-RESEARCH-PLAN.md',
                       '[escape](../README.md)',
                       '[missing](https://github.com/jongos/style-science/blob/main/not-a-file.md)'):
            with self.subTest(source=source), self.assertRaises(AssertionError):
                check_markdown_references(source, SITE, SITE)
        check_markdown_references('[text](./manifesto.md) [web](https://example.org/) [anchor](#section)', SITE, SITE)

    def test_broken_references_and_duplicate_ids_fail(self):
        for source in ('<a href="#missing">x</a>', '<script src="missing-static-fixture.js"></script>',
                       '<a href="../package.json">x</a>', '<p id="x"></p><p id="x"></p>'):
            with self.subTest(source=source), self.assertRaises(AssertionError):
                check_references(Page(source), SITE)


if __name__ == '__main__':
    unittest.main(verbosity=2)
