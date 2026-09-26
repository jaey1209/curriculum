"""templates/form1.hwpx(학교 [서식1] 원본)에서 한글 파일 저장에 쓰는 고정 부분을 뽑아
web/index.html 의 <script id="hwpxTpl"> 블록에 넣는다 (deploy/appsscript/index.html 은 그 복사본).

고정 부분: header.xml(글꼴·테두리·문단 모양), 첫 문단의 구역 설정(용지 방향·여백),
패키지 파일들. 표 칸은 index.html 이 이 header.xml 의 스타일 번호로 직접 만든다.

header.xml 에는 문단 모양 하나만 덧붙인다: 종합의견 칸 본문용(opinionPP). 원본 종합의견 칸의
빈 문단(22번: 가운데 정렬, 줄 간격 130%)과 같되 양쪽 정렬·어절 단위 줄 나눔인 것.

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


def add_opinion_para(header):
    m = re.search(r'<hh:paraProperties itemCnt="(\d+)">', header)
    new_id = int(m.group(1))
    base = re.search(r'<hh:paraPr id="22" .*?</hh:paraPr>', header, re.S).group(0)
    assert 'horizontal="CENTER"' in base and 'breakNonLatinWord="BREAK_WORD"' in base
    assert f'<hh:paraPr id="{new_id}" ' not in header
    pp = (base.replace('id="22"', f'id="{new_id}"', 1)
              .replace('horizontal="CENTER"', 'horizontal="JUSTIFY"')
              .replace('breakNonLatinWord="BREAK_WORD"', 'breakNonLatinWord="KEEP_WORD"'))
    header = header.replace(m.group(0), f'<hh:paraProperties itemCnt="{new_id + 1}">', 1)
    return header.replace("</hh:paraProperties>", pp + "</hh:paraProperties>", 1), new_id


def main():
    z = zipfile.ZipFile(TEMPLATE)
    read = lambda name: z.read(name).decode("utf-8")
    section = read("Contents/section0.xml")
    header, opinion_pp = add_opinion_para(read("Contents/header.xml"))
    tpl = {
        "header": header,
        "opinionPP": opinion_pp,
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


if __name__ == "__main__":
    main()
