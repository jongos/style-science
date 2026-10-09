"""Read-only OOXML facts. Never certifies Word/LibreOffice pagination."""
import hashlib
import io
import zipfile
from xml.etree import ElementTree as ET
from inspection import inspection_fingerprint

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def capture_docx(data, plan, available_fonts=None):
    stamp = inspection_fingerprint(plan)
    if len(data) > 20 * 1024 * 1024:
        raise ValueError('Document exceeds bounded package size')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        if sum(x.file_size for x in archive.infolist()) > 20 * 1024 * 1024 or len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Oversized or duplicate package entries')
        def xml(path):
            raw = archive.read(path)
            text = raw.decode('utf-8')
            if '\x00' in text or '<!DOCTYPE' in text.upper() or '<!ENTITY' in text.upper():
                raise ValueError('DTD/entity declarations are unsupported')
            return ET.fromstring(raw)
        document = xml('word/document.xml')
        styles = xml('word/styles.xml') if 'word/styles.xml' in archive.namelist() else None
    if document.tag != W + 'document':
        raise ValueError('Unsupported document namespace')
    style_ids = [p.get(W + 'val') for p in document.iter(W + 'pStyle')]
    titles = style_ids.count('Title')
    levels = [int(s[-1]) for s in style_ids if s in ['Heading' + str(i) for i in range(1, 10)]]
    known = {'Title', 'Normal', 'Subtitle', 'Quote', 'Callout'} | {'Heading' + str(i) for i in range(1, 10)}
    heading_facts = {'unknown': 'Custom or inherited heading styles need an adapter'} if any(s not in known for s in style_ids) else {'valid': bool(levels) and levels[0] == 1 and all(b <= a + 1 for a, b in zip(levels, levels[1:])), 'levels': levels}
    fonts = sorted({v for tree in (document, styles) if tree is not None for node in tree.iter(W + 'rFonts') for k, v in node.attrib.items() if k in {W + 'ascii', W + 'hAnsi', W + 'eastAsia', W + 'cs'}})
    font_facts = {'unknown': 'Declared fonts or host availability missing'} if not fonts or not isinstance(available_fonts, list) else {'valid': all(f in available_fonts for f in fonts), 'declaredFonts': fonts, 'glyphCoverage': 'unknown'}
    sections = list(document.iter(W + 'sectPr'))
    geometry = {'unknown': 'Exactly one explicit section geometry is required'}
    tables = {'unknown': 'Table geometry is not available'}
    if len(sections) == 1:
        size, margins = sections[0].find(W + 'pgSz'), sections[0].find(W + 'pgMar')
        try:
            width, height = int(size.get(W + 'w')), int(size.get(W + 'h'))
            left, right, top, bottom = [int(margins.get(W + k)) for k in ('left', 'right', 'top', 'bottom')]
            valid = width > 0 and height > 0 and min(left, right, top, bottom) >= 0 and left + right < width and top + bottom < height
            geometry = dict(valid=valid, widthTwips=width, heightTwips=height, contentWidthTwips=width-left-right)
            widths = [t.find('./' + W + 'tblPr/' + W + 'tblW') for t in document.iter(W + 'tbl')]
            if widths and all(t is not None and t.get(W + 'type') == 'dxa' for t in widths):
                tables = dict(valid=valid and all(0 < int(t.get(W + 'w')) <= width-left-right for t in widths), interpretation='Declared widths only, not rendered table bounds')
        except (ValueError, TypeError, AttributeError):
            pass
    facts = {'native-title': {'valid': titles == 1, 'count': titles}, 'native-headings': heading_facts,
             'native-fonts': font_facts, 'native-page-geometry': geometry, 'native-table-bounds': tables,
             'native-pagination': {'unknown': 'No native renderer measurements supplied; explicit page breaks do not prove pagination', 'declaredPageBreaks': sum(b.get(W + 'type') == 'page' for b in document.iter(W + 'br'))}}
    return dict(planHash=stamp, artifactSha256=hashlib.sha256(data).hexdigest(), environment=plan['environment'],
                renderer={'name': 'ooxml-package', 'version': '1'}, settled=True,
                observations={c['id']: {'source': 'package', 'facts': facts.get(c['kind'], {'unknown': 'Unsupported package instrument'})} for c in plan['checks']})
