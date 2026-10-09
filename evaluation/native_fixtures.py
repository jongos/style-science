"""Original small editable OOXML fixtures, not rendered design evidence."""
import io
import zipfile


def native_fixture(variant='normal'):
    title = '' if variant == 'missing-title' else '<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Synthetic Inspection</w:t></w:r></w:p>'
    heading = 'Heading3' if variant == 'heading-jump' else 'Heading1'
    font = 'DefinitelyMissingFont' if variant == 'missing-font' else 'Inter'
    width = '20000' if variant == 'wide-table' else '4000'
    page = '1000' if variant == 'bad-page' else '12240'
    text = 'Original synthetic long content. ' * (1000 if variant == 'long-content' else 2)
    body = title + f'<w:p><w:pPr><w:pStyle w:val="{heading}"/></w:pPr><w:r><w:t>Section</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Quote"/></w:pPr><w:r><w:t>Original quotation</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Callout"/></w:pPr><w:r><w:t>Original callout</w:t></w:r></w:p><w:p><w:r><w:br w:type="page"/><w:t>{text}</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblW w:type="dxa" w:w="{width}"/></w:tblPr><w:tblGrid><w:gridCol w:w="{width}"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w="{page}" w:h="15840"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1440" w:right="1440"/></w:sectPr>'
    styles = ''.join(f'<w:style w:type="paragraph" w:styleId="{name}"><w:name w:val="{name}"/>' + (f'<w:pPr><w:outlineLvl w:val="{int(name[-1])-1}"/></w:pPr>' if name.startswith('Heading') else '') + '</w:style>' for name in ['Normal','Title','Heading1','Heading3','Quote','Callout'])
    files = {
        '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
        '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
        'word/_rels/document.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
        'word/document.xml': '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '</w:body></w:document>',
        'word/styles.xml': f'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/></w:rPr></w:rPrDefault></w:docDefaults>{styles}</w:styles>'
    }
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w') as archive:
        for name, value in sorted(files.items()):
            info = zipfile.ZipInfo(name, (1980,1,1,0,0,0))
            archive.writestr(info, value.encode())
    return data.getvalue()
