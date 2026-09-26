"""templates/form1.hwpx(학교 [서식1] 원본)에서 한글 파일 저장에 쓰는 고정 부분을 뽑아
web/index.html 의 <script id="hwpxTpl"> 블록에 넣는다 (deploy/appsscript/index.html 은 그 복사본).

고정 부분: header.xml(글꼴·테두리·문단 모양), 첫 문단의 구역 설정(용지 방향·여백),
패키지 파일들. 표 칸은 index.html 이 이 header.xml 의 스타일 번호로 직접 만든다.

    python3 tools/embed_hwpx_template.py
"""
import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "form1.hwpx"
TARGET = ROOT / "web" / "index.html"
BLOCK = re.compile(r'(<script type="application/json" id="hwpxTpl">)(.*?)(</script>)', re.S)

z = zipfile.ZipFile(TEMPLATE)
read = lambda name: z.read(name).decode("utf-8")
section = read("Contents/section0.xml")

tpl = {
    "header": read("Contents/header.xml"),
    "secOpen": section[: section.index("<hp:p ")],
    "secPrRun": re.search(r'<hp:run charPrIDRef="\d+"><hp:secPr .*?</hp:ctrl></hp:run>', section, re.S).group(0),
    "version": read("version.xml"),
    "containerXml": read("META-INF/container.xml"),
    "manifestXml": read("META-INF/manifest.xml"),
    "containerRdf": read("META-INF/container.rdf"),
    "contentHpf": read("Contents/content.hpf"),
    "settings": re.sub(r'paraIDRef="\d+" pos="\d+"', 'paraIDRef="0" pos="0"', read("settings.xml")),
}
payload = json.dumps(tpl, ensure_ascii=False).replace("</", "<\\/")

html = TARGET.read_text(encoding="utf-8")
if not BLOCK.search(html):
    raise SystemExit(f'{TARGET}: <script type="application/json" id="hwpxTpl"> 블록이 없습니다.')
TARGET.write_text(BLOCK.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1), encoding="utf-8")
print(f"updated {TARGET.relative_to(ROOT)} ({len(payload):,} chars)")
