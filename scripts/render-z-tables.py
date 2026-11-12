"""Rebuild the two normal-table SVGs from standard-normal.json (no dependencies)."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "tables"
data = json.loads((ASSETS / "standard-normal.json").read_text(encoding="utf-8"))

def render(question, label, context):
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1084" height="550" viewBox="0 0 1084 550" role="img" aria-labelledby="title description">',
        f'<title id="title">Standard normal table for {label}</title>',
        '<desc id="description">Cumulative normal probabilities for row labels 1.0 to 2.4 and column offsets 0.00 to 0.09. Row 1.9 and column 0.06 are highlighted; their intersection is 0.9750, corresponding to z = 1.96.</desc>',
        '<rect width="1084" height="550" fill="white"/>',
        '<g font-family="Arial, sans-serif" fill="#13294b">',
        '<text x="0" y="27" font-size="25">Cumulative probabilities Φ(z) = P(Z ≤ z) · excerpt: z = 1.00–2.49</text>',
        '<text x="0" y="58" font-size="23">For 95% confidence, each tail is 0.025: look for 1 − 0.025 = 0.9750.</text>'
    ]
    widths = [64] + [102]*10
    positions = [0]
    for width in widths:
        positions.append(positions[-1] + width)
    selected_col = data["columns"].index("0.06")
    y0, head_h, row_h = 78, 36, 26
    parts.append(f'<rect x="0" y="{y0}" width="1084" height="{head_h}" fill="#13294b"/>')
    parts.append(f'<rect x="{positions[selected_col]}" y="{y0}" width="102" height="{head_h}" fill="#ed7d31"/>')
    for col, value in enumerate(data["columns"]):
        color = '#13294b' if col == selected_col else 'white'
        parts.append(f'<text x="{positions[col]+widths[col]/2}" y="{y0+25}" text-anchor="middle" font-size="21" font-weight="700" fill="{color}">{value}</text>')
    for idx, row in enumerate(data["rows"]):
        y = y0 + head_h + idx*row_h
        fill = '#f2f5f8' if idx % 2 == 0 else 'white'
        parts.append(f'<rect x="0" y="{y}" width="1084" height="{row_h}" fill="{fill}"/>')
        parts.append(f'<rect x="{positions[selected_col]}" y="{y}" width="102" height="{row_h}" fill="#fff0e4"/>')
        selected = row[0] == "1.9"
        if selected:
            parts.append(f'<rect x="0" y="{y}" width="1084" height="{row_h}" fill="#f9d9be"/>')
            parts.append(f'<rect x="{positions[selected_col]}" y="{y}" width="102" height="{row_h}" fill="#ed7d31" stroke="#13294b" stroke-width="2"/>')
        for col, cell in enumerate(row):
            weight = 700 if selected or col == 0 else 400
            parts.append(f'<text x="{positions[col]+widths[col]/2}" y="{y+20}" text-anchor="middle" font-size="21" font-weight="{weight}">{escape(cell)}</text>')
    parts.append('<path d="M0,504 H1084" stroke="#b6c2cf"/>')
    parts.append(f'<text x="0" y="538" font-size="25" font-weight="700">{escape(context)}</text>')
    parts.append('</g></svg>')
    (ASSETS/f"z-table-q{question}.svg").write_text("\n".join(parts)+"\n",encoding="utf-8")

render(2, "Q2", "Q2: z = 1.9 + 0.06 = 1.96 for the 95% sample-size calculation.")
render(3, "Q3(b)", "Q3(b): z = 1.9 + 0.06 = 1.96 for the 95% mean confidence interval.")
