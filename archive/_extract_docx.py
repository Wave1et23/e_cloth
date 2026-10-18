import re
import sys
import zipfile

path = r"C:\myproject\e_cloth\关于举办杭州电子科技大学第二届AIGC应用创新大赛的通知.docx"

with zipfile.ZipFile(path) as z:
    names = [n for n in z.namelist() if n.startswith("word/") and n.endswith(".xml")]
    print("PARTS:", names)
    xml = z.read("word/document.xml").decode("utf-8", "ignore")

# Split on paragraph boundaries so line structure is preserved.
xml = xml.replace("</w:p>", "</w:p>\n@@PARA@@\n")
xml = re.sub(r"<w:br\s*/>", "\n", xml)
xml = re.sub(r"<w:tab\s*/>", "\t", xml)

lines = []
for block in xml.split("@@PARA@@"):
    texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", block, flags=re.S)
    if not texts:
        continue
    line = "".join(texts)
    line = (
        line.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&apos;", "'")
    )
    line = line.strip()
    if line:
        lines.append(line)

lines = [ln.replace("\xa0", " ").replace("\u3000", " ") for ln in lines]
out = r"C:\myproject\e_cloth\_notice.txt"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
    f.write("\n=== TOTAL LINES: %d\n" % len(lines))
print("WROTE", out, len(lines))
