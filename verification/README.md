# Verification

This preprint has received internal checks. It has not undergone external peer review, and no Lean formalization is supplied.

From the repository root, run:

    python verification/verify_files.py
    node verification/check-certificates.mjs

These commands require Python 3.9+ and Node.js; the checks were run with Node 26.13.1. The first verifies the archived file hashes. The second reproduces 95 checks of the profile table and 220 independent arithmetic assertions, comparing the results with the saved certificates. The graph arguments, induction and exchanges are proved in the paper.

The profile certificate uses CRLF line endings. The comparison reads JSON values, so line endings do not affect the result. The two checks can also be run separately:

    node verification/structural_potential_check.mjs --simple780
    node verification/audit-final-gap.mjs

To build the paper, install pdfLaTeX with the packages listed in paper/main.tex and the Python dependencies in verification/requirements.txt, then run:

    python verification/build-paper.py

The script compiles twice and checks for unresolved references and overfull boxes. It adds page numbers while preserving hyperlinks. PDF bytes may vary with tool versions and timestamps; verification/SHA256SUMS identifies the supplied PDF.

The v1.0 tagged commit contains the original README, PDF and checksum file. Its Release attachments are the PDF and SHA256SUMS. This revision supplies the original TeX identified by that checksum file; the full historical research archive is not included.

[Original release](https://github.com/denudatamour/tuza-book-three/releases/tag/v1.0) · [Fixed commit](https://github.com/denudatamour/tuza-book-three/commit/ca6f02b253c8204f0777362af37590f4b9810ca6)
