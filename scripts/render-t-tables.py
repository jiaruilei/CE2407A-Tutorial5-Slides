"""Rebuild the two vector tables from the course-table transcription (no dependencies)."""
from pathlib import Path
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "tables"
data = json.loads((ASSETS / "student-t.json").read_text(encoding="utf-8"))

def render(question, df, value, context):
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1084" height="550" viewBox="0 0 1084 550" role="img" aria-labelledby="title description">',
        f'<title id="title">Student’s t table for Q{question}</title>',
        f'<desc id="description">Selected upper-tail probabilities, degrees of freedom 1–29 and infinity. Highlight row {df} and column 0.025: t = {value}.</desc>',
        '<rect width="1084" height="550" fill="white"/>',
        '<g font-family="Arial, sans-serif" fill="#13294b">',
        '<text x="0" y="27" font-size="25">Column α is the upper-tail probability: P(T &gt; t) = α</text>',
        '<text x="0" y="58" font-size="23">For a 95% interval or a two-sided 5% test, use α = 0.025 in each tail.</text>'
    ]
    for start, offset in [(0, 0), (15, 568)]:
        widths = [56, 92, 92, 92, 92, 92]
        positions = [offset]
        for width in widths:
            positions.append(positions[-1] + width)
        y0, head_h, row_h = 78, 36, 26
        parts.append(f'<rect x="{offset}" y="{y0}" width="516" height="{head_h}" fill="#13294b"/>')
        parts.append(f'<rect x="{positions[3]}" y="{y0}" width="92" height="{head_h}" fill="#ed7d31"/>')
        for col, label in enumerate(data["columns"]):
            color = '#13294b' if col == 3 else 'white'
            parts.append(f'<text x="{positions[col] + widths[col]/2}" y="{y0+25}" text-anchor="middle" font-size="21" font-weight="700" fill="{color}">{label}</text>')
        for idx, row in enumerate(data["rows"][start:start+15]):
            y = y0 + head_h + idx*row_h
            fill = '#f2f5f8' if idx % 2 == 0 else 'white'
            parts.append(f'<rect x="{offset}" y="{y}" width="516" height="{row_h}" fill="{fill}"/>')
            parts.append(f'<rect x="{positions[3]}" y="{y}" width="92" height="{row_h}" fill="#fff0e4"/>')
            selected = row[0] == df
            if selected:
                parts.append(f'<rect x="{offset}" y="{y}" width="516" height="{row_h}" fill="#f9d9be"/>')
                parts.append(f'<rect x="{positions[3]}" y="{y}" width="92" height="{row_h}" fill="#ed7d31" stroke="#13294b" stroke-width="2"/>')
            for col, cell in enumerate(row):
                weight = 700 if selected or col == 0 else 400
                parts.append(f'<text x="{positions[col]+widths[col]/2}" y="{y+20}" text-anchor="middle" font-size="21" font-weight="{weight}">{escape(str(cell))}</text>')
        parts.append(f'<path d="M{offset},504 H{offset+516}" stroke="#b6c2cf"/>')
    parts.append(f'<text x="0" y="538" font-size="25" font-weight="700">{escape(context)}</text>')
    parts.append('</g></svg>')
    (ASSETS/f"t-table-q{question}.svg").write_text("\n".join(parts)+"\n", encoding="utf-8")

render(3, 8, "2.306", "Q3(c): n = 9 → df = 8 → t = 2.306 for the confidence-interval margin.")
render(4, 9, "2.262", "Q4: n = 10 → df = 9 → two-sided critical values are −2.262 and +2.262.")
