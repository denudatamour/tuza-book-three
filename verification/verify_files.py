from hashlib import sha256
from pathlib import Path, PurePosixPath
import re
root = Path(__file__).resolve().parents[1]
seen = set()
for line in (root / 'verification/SHA256SUMS').read_text(encoding='utf-8').splitlines():
    expected, name = line.split('  ', 1)
    q = PurePosixPath(name)
    assert re.fullmatch('[0-9a-f]{64}', expected)
    assert not q.is_absolute() and '..' not in q.parts and name not in seen
    path = root / name
    assert path.resolve().is_relative_to(root) and not path.is_symlink()
    assert sha256(path.read_bytes()).hexdigest() == expected, name
    seen.add(name)
print('Verified', len(seen), 'archived file hashes.')
