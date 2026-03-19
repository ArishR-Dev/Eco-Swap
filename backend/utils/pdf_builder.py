import os
from flask import current_app
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Table,
    TableStyle,
    Spacer,
    Image,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER


def build_certificate_pdf(certificate, file_path):
    """Generate a styled recycling certificate PDF matching the frontend UI.

    This version avoids large KeepTogether blocks and allows Platypus to
    flow content across pages. Tables use the document width to prevent
    overflow and the image is constrained with `kind="proportional"`.
    Margins are increased to give breathing room.
    """

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=50,
    )

    # prepare styles once
    title_style = ParagraphStyle(
        name="title",
        fontSize=20,
        alignment=TA_CENTER,
        textColor=HexColor("#333333"),
        leading=24,
        spaceAfter=6,
        bold=True,
    )
    subtitle_style = ParagraphStyle(
        name="subtitle",
        fontSize=9,
        alignment=TA_CENTER,
        textColor=HexColor("#888888"),
        spaceAfter=12,
    )
    label_style = ParagraphStyle(
        name="label",
        fontSize=9,
        textColor=HexColor("#888888"),
    )
    value_style = ParagraphStyle(
        name="value",
        fontSize=12,
        alignment=TA_CENTER,
        leading=14,
        bold=True,
    )
    footer_style = ParagraphStyle(
        name="footer",
        fontSize=9,
        alignment=TA_CENTER,
        textColor=HexColor("#888888"),
        spaceBefore=12,
    )

    story = []

    # logo (constrained)
    logo_path = os.path.join(current_app.root_path, "static", "logo.png")
    if os.path.exists(logo_path):
        story.append(Image(logo_path, width=70, height=70, kind="proportional"))
        story.append(Spacer(1, 12))

    # header text
    story.append(Paragraph("E-Waste Recycling Certificate", title_style))
    story.append(Paragraph(f"Certificate ID: {certificate.id}", subtitle_style))
    story.append(Spacer(1, 12))

    # info table (half/half of doc width)
    data = [
        [Paragraph("Total Weight", label_style), Paragraph("CO₂ Saved", label_style)],
        [Paragraph(f"{certificate.total_weight} kg", value_style), Paragraph(f"{certificate.co2_saved} kg", value_style)],
    ]
    info_tbl = Table(data, colWidths=[doc.width / 2, doc.width / 2])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f3f4f6")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDED", (0, 0), (-1, -1), 5),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 12))

    # pickup id box (full width)
    tbl2 = Table(
        [[Paragraph("Pickup ID", label_style)], [Paragraph(certificate.pickup_id or "", value_style)]],
        colWidths=[doc.width],
    )
    tbl2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f3f4f6")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDED", (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl2)
    story.append(Spacer(1, 12))

    # issue date box (full width)
    tbl3 = Table(
        [[Paragraph("Issue Date", label_style)], [Paragraph(str(certificate.issued_at), value_style)]],
        colWidths=[doc.width],
    )
    tbl3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f3f4f6")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("ROUNDED", (0, 0), (-1, -1), 5),
    ]))
    story.append(tbl3)

    story.append(Spacer(1, 24))
    footer_text = (
        "This certificate confirms that the above e-waste items have been properly recycled in accordance with environmental regulations."
    )
    story.append(Paragraph(footer_text, footer_style))

    # build document with the story list
    doc.build(story)
