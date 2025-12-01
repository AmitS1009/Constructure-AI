from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Door Schedule", ln=1, align="C")
pdf.cell(200, 10, txt="Mark: D-101, Location: Corridor, Width: 900mm, Height: 2100mm, Fire Rating: 1hr, Material: Steel", ln=1, align="L")
pdf.cell(200, 10, txt="Mark: D-102, Location: Office, Width: 850mm, Height: 2100mm, Fire Rating: None, Material: Wood", ln=1, align="L")
pdf.output("test_door_schedule.pdf")
