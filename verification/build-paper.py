"""Rebuild the attributed manuscript; requires pdfLaTeX and requirements.txt."""
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone
from hashlib import sha256
import importlib.metadata
import json
import os
import platform
import subprocess
import sys
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[1]

def target(relative):
    out = ROOT / relative
    assert out.resolve().is_relative_to(ROOT)
    for node in (out, *out.parents):
        if node.exists():
            assert not node.is_symlink()
            assert not (getattr(node.lstat(), 'st_file_attributes', 0) & 0x400)
    return out

source = target('paper/main.tex')
work = target('build')
work.mkdir(exist_ok=True)
command = ['pdflatex', '-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error',
           '-output-directory=' + str(work), str(source)]
for number in (1, 2):
    result = subprocess.run(command, cwd=ROOT, capture_output=True, timeout=120)
    target('build/pdflatex-pass-' + str(number) + '.stdout.log').write_bytes(result.stdout)
    target('build/pdflatex-pass-' + str(number) + '.stderr.log').write_bytes(result.stderr)
    assert result.returncode == 0, 'See build/pdflatex-pass-' + str(number) + '.stdout.log'
log = target('build/main.log').read_text(encoding='utf-8', errors='replace')
for bad in ('undefined references', 'undefined on input line', 'Overfull'):
    assert bad not in log, bad
reader = PdfReader(target('build/main.pdf'))
writer = PdfWriter(clone_from=reader)
count = len(reader.pages)
for number, page in enumerate(writer.pages, 1):
    overlay = BytesIO()
    c = Canvas(overlay, pagesize=(float(page.mediabox.width), float(page.mediabox.height)))
    c.setFillColor(HexColor('#47505a'))
    c.setFont('Helvetica', 8.2)
    c.drawCentredString(float(page.mediabox.width)/2, 29, f'{number} / {count}')
    c.save()
    overlay.seek(0)
    page.merge_page(PdfReader(overlay).pages[0])
writer.add_metadata({
    '/Title': 'A uniform gap below two for triangle packings and edge transversals in K4-free graphs of book size at most three',
    '/Author': 'Haimin Zhou',
    '/Subject': 'Version 1.0.1: attribution and archival revision of the proof of 177 tau <= 353 nu',
})
destination = target('paper/paper.pdf')
with destination.open('wb') as f:
    writer.write(f)
saved = PdfReader(destination)
assert len(saved.pages) == count
assert saved.named_destinations
assert sum(len(page.get('/Annots', [])) for page in saved.pages) > 0
text = '\n'.join(page.extract_text() for page in saved.pages)
assert 'Haimin Zhou' in text and 'haiminzhou.1@gmail.com' in text
assert 'This research was conducted with AI assistance.' in ' '.join(text.split())
record = {
    'completed_utc': datetime.now(timezone.utc).isoformat(),
    'python': sys.version, 'os': platform.platform(), 'command': command,
    'pdflatex': subprocess.check_output(['pdflatex','--version'], text=True).splitlines()[0],
    'pypdf': importlib.metadata.version('pypdf'),
    'reportlab': importlib.metadata.version('reportlab'),
    'pages': count, 'bytes': destination.stat().st_size,
    'sha256': sha256(destination.read_bytes()).hexdigest(),
    'author': saved.metadata.author,
    'source_sha256': sha256(source.read_bytes()).hexdigest()
}
target('build/build-record.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print(json.dumps(record, indent=2))
