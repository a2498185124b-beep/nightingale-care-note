from pathlib import Path
from textwrap import wrap

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "nightingale-care-note-technical-brief.pdf"
WIDTH, HEIGHT = A4

NAVY = HexColor("#17333A")
TEAL = HexColor("#2D756D")
MINT = HexColor("#DCEFEA")
CREAM = HexColor("#F5F1E8")
CORAL = HexColor("#E46F5A")
INK = HexColor("#213338")
MUTED = HexColor("#5D7075")
LINE = HexColor("#D5E1DF")


def register_fonts():
    regular = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("N-Regular", str(regular)))
        pdfmetrics.registerFont(TTFont("N-Bold", str(bold)))
        return "N-Regular", "N-Bold"
    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def rounded_box(c, x, y, w, h, fill, stroke=LINE, radius=10):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def line_wrap(text, width_chars):
    return wrap(text, width=width_chars, break_long_words=False, break_on_hyphens=False) or [""]


def draw_text(c, text, x, y, width, size=9, color=INK, font=REGULAR, leading=None, max_lines=None):
    leading = leading or size * 1.35
    lines = line_wrap(text, max(16, int(width / (size * 0.52))))
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def header(c, section, page):
    c.setFillColor(NAVY)
    c.rect(0, HEIGHT - 46, WIDTH, 46, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(BOLD, 11)
    c.drawString(34, HEIGHT - 29, "NIGHTINGALE / CARE NOTE")
    c.setFont(REGULAR, 8)
    c.drawRightString(WIDTH - 34, HEIGHT - 29, section.upper())
    c.setStrokeColor(LINE)
    c.line(34, 28, WIDTH - 34, 28)
    c.setFillColor(MUTED)
    c.setFont(REGULAR, 7)
    c.drawString(34, 17, "Synthetic-data prototype - not for clinical use")
    c.drawRightString(WIDTH - 34, 17, f"72HR BUILD / {page:02d}")


def section_title(c, kicker, title, x, y):
    c.setFillColor(TEAL)
    c.setFont(BOLD, 7.5)
    c.drawString(x, y, kicker.upper())
    c.setFillColor(NAVY)
    c.setFont(BOLD, 20)
    c.drawString(x, y - 25, title)


def metric(c, x, y, w, value, label, fill=MINT):
    rounded_box(c, x, y, w, 58, fill, stroke=fill)
    c.setFillColor(NAVY)
    c.setFont(BOLD, 18)
    c.drawString(x + 12, y + 31, value)
    c.setFillColor(MUTED)
    c.setFont(REGULAR, 7.2)
    c.drawString(x + 12, y + 14, label.upper())


def arrow(c, x1, y1, x2, y2):
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.5)
    c.line(x1, y1, x2, y2)
    c.setFillColor(TEAL)
    c.line(x2, y2, x2 - 5, y2 + 3)
    c.line(x2, y2, x2 - 5, y2 - 3)


def page_one(c):
    header(c, "Product and architecture", 1)
    section_title(c, "Executive brief", "Trusted context. Clear next steps.", 34, HEIGHT - 78)
    draw_text(
        c,
        "One longitudinal care note that turns fragmented clinical, staff and AI entries into a source-linked consult glance - while keeping authorization, revision history and clinician judgment explicit.",
        34,
        HEIGHT - 126,
        WIDTH - 68,
        size=9.5,
        color=MUTED,
        leading=14,
    )

    metric(c, 34, HEIGHT - 238, 162, "6.38 ms", "warm SSR P95 / target <= 300 ms")
    metric(c, 207, HEIGHT - 238, 162, "11 + 1", "domain tests + rendered-shell test", CREAM)
    metric(c, 380, HEIGHT - 238, 181, "4 / 4", "priority cards resolve to a source")

    c.setFillColor(NAVY)
    c.setFont(BOLD, 11)
    c.drawString(34, HEIGHT - 272, "Highest-value trust loop")
    steps = [
        ("01", "GLANCE", "Four capped, ranked cards"),
        ("02", "TRACE", "Entry + version + quote"),
        ("03", "DECIDE", "Accept, reject or edit"),
        ("04", "RECOVER", "Snapshot + audit event"),
    ]
    x = 34
    for index, (number, title, detail) in enumerate(steps):
        rounded_box(c, x, HEIGHT - 370, 119, 72, white)
        c.setFillColor(CORAL if index == 0 else TEAL)
        c.setFont(BOLD, 8)
        c.drawString(x + 10, HEIGHT - 316, number)
        c.setFillColor(NAVY)
        c.setFont(BOLD, 9)
        c.drawString(x + 10, HEIGHT - 335, title)
        draw_text(c, detail, x + 10, HEIGHT - 351, 99, size=6.8, color=MUTED, leading=9, max_lines=2)
        if index < len(steps) - 1:
            arrow(c, x + 119, HEIGHT - 334, x + 133, HEIGHT - 334)
        x += 133

    c.setFillColor(NAVY)
    c.setFont(BOLD, 11)
    c.drawString(34, HEIGHT - 407, "Runtime architecture")

    boxes = [
        (34, "ROLE-SAFE UI", "server-filtered bundle"),
        (170, "API GUARD", "role + clinic + owner"),
        (306, "D1 RECORD", "entries + versions"),
        (442, "TRUST LEDGER", "provenance + audit"),
    ]
    for index, (bx, title, detail) in enumerate(boxes):
        fill = NAVY if index in (0, 3) else MINT
        rounded_box(c, bx, HEIGHT - 495, 119, 58, fill, stroke=fill)
        c.setFillColor(white if index in (0, 3) else NAVY)
        c.setFont(BOLD, 7.5)
        c.drawString(bx + 9, HEIGHT - 459, title)
        c.setFont(REGULAR, 6.5)
        c.drawString(bx + 9, HEIGHT - 476, detail)
        if index < len(boxes) - 1:
            arrow(c, bx + 119, HEIGHT - 466, bx + 133, HEIGHT - 466)

    rounded_box(c, 34, HEIGHT - 610, WIDTH - 68, 88, CREAM, stroke=CREAM)
    c.setFillColor(CORAL)
    c.setFont(BOLD, 8)
    c.drawString(48, HEIGHT - 545, "AI BOUNDARY")
    draw_text(c, "Voice/text intake -> local identifier redaction -> fail-closed model gateway -> separate pending-review AI entry.", 48, HEIGHT - 563, WIDTH - 96, size=9, leading=13)
    draw_text(c, "No external model call runs in this prototype. AI never silently overwrites clinician-authored content.", 48, HEIGHT - 594, WIDTH - 96, size=8, color=MUTED, leading=11)

    rounded_box(c, 34, HEIGHT - 720, WIDTH - 68, 78, NAVY, stroke=NAVY)
    c.setFillColor(white)
    c.setFont(BOLD, 10)
    c.drawString(48, HEIGHT - 666, "72-hour product decision")
    draw_text(c, "Build one complete, inspectable trust loop before adding real ambient capture or broad EHR scope. Every record and identity in the demo is synthetic.", 48, HEIGHT - 684, WIDTH - 96, size=8.5, color=white, leading=12)


def page_two(c):
    header(c, "Authorization and trust", 2)
    section_title(c, "Server-enforced", "Roles, revisions and accountable AI", 34, HEIGHT - 78)
    draw_text(c, "UI visibility is never authorization. Each protected request derives the actor from an HttpOnly session and rechecks role, clinic and section ownership.", 34, HEIGHT - 126, WIDTH - 68, size=9, color=MUTED, leading=13)

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 170, "RBAC matrix")
    table_x, table_y = 34, HEIGHT - 344
    widths = [72, 245, 210]
    headers = ["ACTOR", "READ", "WRITE"]
    rows = [
        ("Patient", "Patient-visible instructions only", "No internal notes or comments"),
        ("Staff", "Same-clinic staff/patient/shared AI", "Staff notes + comments"),
        ("Clinician", "All same-clinic entries + AI context", "Clinician notes + AI review"),
        ("Admin", "Same-clinic oversight + audit metadata", "No clinical/staff overwrite"),
    ]
    row_h = 31
    x = table_x
    for width, label in zip(widths, headers):
        c.setFillColor(NAVY)
        c.rect(x, table_y + row_h * 4, width, 24, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(BOLD, 7)
        c.drawString(x + 8, table_y + row_h * 4 + 8, label)
        x += width
    for row_index, row in enumerate(rows):
        y = table_y + row_h * (3 - row_index)
        x = table_x
        for col_index, (width, value) in enumerate(zip(widths, row)):
            c.setFillColor(white if row_index % 2 == 0 else HexColor("#F3F7F6"))
            c.setStrokeColor(LINE)
            c.rect(x, y, width, row_h, fill=1, stroke=1)
            c.setFillColor(TEAL if col_index == 0 else INK)
            c.setFont(BOLD if col_index == 0 else REGULAR, 7.2)
            c.drawString(x + 8, y + 11, value)
            x += width

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 382, "Three distinct accountability records")
    cards = [
        ("REVISION", "Recoverable content snapshot", "full content + version + editor"),
        ("PROVENANCE", "How an output came to exist", "source entry + version + quote"),
        ("AUDIT EVENT", "Who acted and with what outcome", "actor + action + versions; no raw note"),
    ]
    x = 34
    for index, (title, purpose, fields) in enumerate(cards):
        rounded_box(c, x, HEIGHT - 485, 165, 82, MINT if index == 1 else white)
        c.setFillColor(CORAL if index == 1 else TEAL)
        c.setFont(BOLD, 7)
        c.drawString(x + 11, HEIGHT - 423, title)
        draw_text(c, purpose, x + 11, HEIGHT - 441, 143, size=8, font=BOLD, leading=11, max_lines=2)
        draw_text(c, fields, x + 11, HEIGHT - 468, 143, size=6.8, color=MUTED, leading=9, max_lines=2)
        x += 181

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 524, "Safe edit and revert sequence")
    sequence = [
        ("1", "Client sends content + expectedVersion"),
        ("2", "Server rechecks role / clinic / section"),
        ("3", "Atomic update only if version matches"),
        ("4", "New snapshot + append-only audit metadata"),
    ]
    y = HEIGHT - 555
    for number, text_value in sequence:
        c.setFillColor(TEAL)
        c.circle(46, y + 3, 10, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont(BOLD, 7)
        c.drawCentredString(46, y, number)
        draw_text(c, text_value, 65, y + 1, 470, size=8.5, leading=11)
        y -= 32
    c.setStrokeColor(LINE)
    c.line(46, HEIGHT - 566, 46, HEIGHT - 642)

    rounded_box(c, 34, HEIGHT - 754, WIDTH - 68, 82, CREAM, stroke=CREAM)
    c.setFillColor(CORAL)
    c.setFont(BOLD, 8)
    c.drawString(48, HEIGHT - 695, "SAFETY BOUNDARY")
    draw_text(c, "Regex redaction is a prototype control, not certified de-identification. Production requires stronger entity detection, fail-closed review, vendor retention controls and legal/security validation before real patient data.", 48, HEIGHT - 714, WIDTH - 96, size=8.2, leading=12)


def page_three(c):
    header(c, "Validation and roadmap", 3)
    section_title(c, "Measured and explicit", "Evidence, performance and next steps", 34, HEIGHT - 78)

    metric(c, 34, HEIGHT - 190, 162, "3.44 ms", "warm SSR P50")
    metric(c, 207, HEIGHT - 190, 162, "6.38 ms", "warm SSR P95", CREAM)
    metric(c, 380, HEIGHT - 190, 181, "10.58 ms", "warm SSR maximum")
    draw_text(c, "5 warm-ups + 30 measured sequential requests against the built Worker. This is shell time, not an internet or clinical SLA.", 34, HEIGHT - 213, WIDTH - 68, size=7.6, color=MUTED, leading=10)

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 254, "Automated validation")
    tests = [
        "Clinic and role scope; patient internal-note boundary",
        "Immutable revisions; revert creates a new version",
        "Exact highlight source, source version and quoted span",
        "Stale same-section write returns deterministic conflict",
        "Separate role-owned sections do not overwrite each other",
        "Clinician feedback changes bounded importance weights",
        "Identifiers are removed before the model boundary",
    ]
    y = HEIGHT - 282
    for item in tests:
        c.setFillColor(TEAL)
        c.circle(40, y + 2, 3, fill=1, stroke=0)
        draw_text(c, item, 51, y + 4, 505, size=8, leading=11)
        y -= 22

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 462, "72-hour scope: now vs. next")
    rounded_box(c, 34, HEIGHT - 621, 253, 137, MINT, stroke=MINT)
    rounded_box(c, 308, HEIGHT - 621, 253, 137, CREAM, stroke=CREAM)
    c.setFillColor(TEAL)
    c.setFont(BOLD, 8)
    c.drawString(48, HEIGHT - 507, "BUILT NOW")
    c.setFillColor(CORAL)
    c.drawString(322, HEIGHT - 507, "NEXT VALIDATION GATE")
    left = ["Glance + exact source jumps", "Server RBAC + comments", "Versions + real revert + conflicts", "Feedback learning + audit", "Pre-model redaction boundary"]
    right = ["Clinic SSO and membership claims", "Clinician study on synthetic cases", "Consented multilingual ambient capture", "Stronger entity detection + review", "Security/legal review before real data"]
    for index, value in enumerate(left):
        draw_text(c, f"- {value}", 48, HEIGHT - 530 - index * 18, 220, size=7.4, leading=10)
    for index, value in enumerate(right):
        draw_text(c, f"- {value}", 322, HEIGHT - 530 - index * 18, 220, size=7.4, leading=10)

    c.setFillColor(NAVY)
    c.setFont(BOLD, 10.5)
    c.drawString(34, HEIGHT - 658, "Evidence used to shape the build")
    sources = [
        "Singapore MOH - patient-data AI security requirements (4 Aug 2026)",
        "OWASP A01 - server-side, deny-by-default access control",
        "HL7 FHIR R5 - Provenance and AuditEvent separation",
        "HHS - formal de-identification pathways and residual risk",
        "NIST AI RMF 1.0 - transparent, monitored AI risk management",
        "JMIR 2026 - ambient workflow effects and AI-scribe quality risks",
    ]
    y = HEIGHT - 683
    for source in sources:
        draw_text(c, source, 34, y, WIDTH - 68, size=7.1, color=MUTED, leading=9)
        y -= 17

    c.setFillColor(NAVY)
    c.setFont(BOLD, 8)
    c.drawString(34, 52, "Full URLs and claim-level notes: README.md and research/claim-source-ledger.md")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Nightingale Care Note - Technical Brief")
    c.setAuthor("Nightingale 72HR Build")
    for draw_page in (page_one, page_two, page_three):
        draw_page(c)
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
