"""templates/form1~3.hwpx(학교 [서식1]·[서식2]·[서식3] 원본)에서 한글 파일 저장에 쓰는 부분을 뽑아
web/index.html 의 <script id="hwpxTpl"> 블록에 넣는다 (deploy/appsscript/index.html 은 그 복사본).

    python3 tools/embed_hwpx_template.py

f1 ([서식1]): header.xml(글꼴·테두리·문단 모양), 첫 문단의 구역 설정, 패키지 파일들. 표 칸은 index.html 이
    이 header.xml 의 스타일 번호로 직접 만든다. header.xml 에는 종합의견 칸 본문용 문단 모양(opinionPP) 하나만
    덧붙인다(원본 22번과 같되 양쪽 정렬·어절 단위 줄 나눔).
f2·f3 ([서식2]·[서식3]): 원본 구역 XML 을 그대로 쓰되, 빈 칸 문단을 §P:열:문단모양:스타일:글자모양§ 표시로 바꾸고
    표의 줄을 같은 모양끼리 묶어(protos) 두어 index.html 이 칸을 채우고 줄 수를 맞춘다.
    header.xml 에는 좁은 칸에서 줄이 넘어가지 않도록 작은 글자 모양 몇 개를 덧붙인다.
"""
import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates"
TARGET = ROOT / "web" / "index.html"
BLOCK = re.compile(r'(<script type="application/json" id="hwpxTpl">)(.*?)(</script>)', re.S)
LINESEG = re.compile(r"<hp:linesegarray>.*?</hp:linesegarray>", re.S)
SECPR_RUN = re.compile(r'<hp:run charPrIDRef="\d+"><hp:secPr .*?</hp:ctrl></hp:run>', re.S)


def add_para_pr(header, base_id, horizontal="JUSTIFY"):
    """base_id 문단 모양을 복사해 정렬만 바꾼 새 문단 모양을 덧붙이고 (header, 새 번호) 를 돌려줌"""
    m = re.search(r'<hh:paraProperties itemCnt="(\d+)">', header)
    new_id = int(m.group(1))
    base = re.search(r'<hh:paraPr id="%d" .*?</hh:paraPr>' % base_id, header, re.S).group(0)
    assert f'<hh:paraPr id="{new_id}" ' not in header
    pp = re.sub(r'horizontal="\w+"', f'horizontal="{horizontal}"', base.replace(f'id="{base_id}"', f'id="{new_id}"', 1))
    pp = pp.replace('breakNonLatinWord="BREAK_WORD"', 'breakNonLatinWord="KEEP_WORD"')
    header = header.replace(m.group(0), f'<hh:paraProperties itemCnt="{new_id + 1}">', 1)
    return header.replace("</hh:paraProperties>", pp + "</hh:paraProperties>", 1), new_id


def add_opinion_para(header):
    """[서식1] 종합의견 칸 본문: 원본 22번(가운데 정렬, 줄 간격 130%)을 양쪽 정렬·어절 단위로"""
    base = re.search(r'<hh:paraPr id="22" .*?</hh:paraPr>', header, re.S).group(0)
    assert 'horizontal="CENTER"' in base and 'breakNonLatinWord="BREAK_WORD"' in base
    return add_para_pr(header, 22)


def add_char_pr(header, base_id, height, ratio=100):
    """base_id 글자 모양을 복사해 크기(height, 1pt=100)·장평(ratio %)만 바꾼 새 글자 모양"""
    m = re.search(r'<hh:charProperties itemCnt="(\d+)">', header)
    new_id = int(m.group(1))
    base = re.search(r'<hh:charPr id="%d" .*?</hh:charPr>' % base_id, header, re.S).group(0)
    assert f'<hh:charPr id="{new_id}" ' not in header
    cp = re.sub(r'height="\d+"', f'height="{height}"', base.replace(f'id="{base_id}"', f'id="{new_id}"', 1), count=1)
    cp = re.sub(r'<hh:ratio [^>]*/>', '<hh:ratio ' + " ".join(f'{k}="{ratio}"' for k in
                ("hangul", "latin", "hanja", "japanese", "other", "symbol", "user")) + "/>", cp)
    header = header.replace(m.group(0), f'<hh:charProperties itemCnt="{new_id + 1}">', 1)
    return header.replace("</hh:charProperties>", cp + "</hh:charProperties>", 1), new_id


def package(z):
    read = lambda name: z.read(name).decode("utf-8")
    return {
        "version": read("version.xml"),
        "containerXml": read("META-INF/container.xml"),
        "manifestXml": read("META-INF/manifest.xml"),
        "containerRdf": read("META-INF/container.rdf"),
        "contentHpf": read("Contents/content.hpf"),
        "settings": re.sub(r'paraIDRef="\d+" pos="\d+"', 'paraIDRef="0" pos="0"', read("settings.xml")),
    }


def top_paragraphs(body):
    """구역 본문을 맨 위 문단들로 나눔 (표 칸 안의 문단은 그 문단 안에 그대로)"""
    out, depth, start = [], 0, None
    for m in re.finditer(r"<hp:p |</hp:p>", body):
        if m.group(0) == "<hp:p ":
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(body[start:m.end()])
    return out


def form1():
    z = zipfile.ZipFile(TEMPLATES / "form1.hwpx")
    section = z.read("Contents/section0.xml").decode("utf-8")
    header, opinion_pp = add_opinion_para(z.read("Contents/header.xml").decode("utf-8"))
    return dict(package(z), header=header, opinionPP=opinion_pp,
                secOpen=section[: section.index("<hp:p ")], secPrRun=SECPR_RUN.search(section).group(0))


def fill_template(name, extra):
    """[서식2]·[서식3]: 칸을 채울 수 있게 표시를 넣은 원본 구역 XML"""
    z = zipfile.ZipFile(TEMPLATES / name)
    section = LINESEG.sub("", z.read("Contents/section0.xml").decode("utf-8"))
    header, ids = extra(z.read("Contents/header.xml").decode("utf-8"))
    sec_open = section[: section.index("<hp:p ")]
    paras = top_paragraphs(section[section.index("<hp:p "): section.rindex("</hs:sec>")])
    sec_pr = SECPR_RUN.search(paras[0]).group(0)
    paras = [re.sub(r'<hp:p id="\d+"', '<hp:p id="2147483648"', p, count=1) for p in paras]
    paras[0] = (paras[0].replace(sec_pr, "§SECPR§", 1).replace('id="2147483648"', 'id="§PID§"', 1)
                .replace('pageBreak="0"', 'pageBreak="§PB§"', 1))
    tbl_i = next(i for i, p in enumerate(paras) if "<hp:tbl " in p)
    tp = paras[tbl_i]
    pre, post = tp[: tp.index("<hp:tr>")], tp[tp.rindex("</hp:tr>") + len("</hp:tr>"):]
    pre = re.sub(r'(<hp:tbl id=")\d+(" zOrder=")\d+', r"\1§TID§\2§Z§", pre, count=1)
    pre = re.sub(r'rowCnt="\d+"', 'rowCnt="§RC§"', pre, count=1)
    pre = re.sub(r'(<hp:sz width="\d+" widthRelTo="\w+" height=")\d+', r"\1§TH§", pre, count=1)
    protos, rows = [], []
    for tr in re.findall(r"<hp:tr>.*?</hp:tr>", tp, re.S):
        heights = [int(h) for h in re.findall(r'rowSpan="1"/><hp:cellSz width="\d+" height="(\d+)"', tr)]
        cells = []
        for tc in re.findall(r"<hp:tc .*?</hp:tc>", tr, re.S):
            col = re.search(r'colAddr="(\d+)"', tc).group(1)
            tc = re.sub(r'rowAddr="\d+"', 'rowAddr="§R§"', tc)
            # 빈 칸 문단 → 채울 자리 표시 (열 번호·문단 모양·스타일·글자 모양)
            tc = re.sub(r'<hp:p id="\d+" paraPrIDRef="(\d+)" styleIDRef="(\d+)" pageBreak="0" columnBreak="0" merged="0">'
                        r'<hp:run charPrIDRef="(\d+)"/></hp:p>',
                        lambda m: f"§P:{col}:{m.group(1)}:{m.group(2)}:{m.group(3)}§", tc)
            cells.append(tc)
        xml = "<hp:tr>" + "".join(cells) + "</hp:tr>"
        if xml not in [p["xml"] for p in protos]:
            protos.append({"xml": xml, "h": heights[0] if heights else 0})
        rows.append([p["xml"] for p in protos].index(xml))
    paras[tbl_i] = "§TABLE§"   # 표 문단은 tblPre + 줄들 + tblPost 로 다시 만듦
    return dict(package(z), header=header, secOpen=sec_open, secPrRun=sec_pr, paras=paras, tblPara=tbl_i,
                tblPre=pre, tblPost=post, protos=protos, rows=rows, **ids)


def form2_extra(header):
    # 위원 이름(13pt 굵게 → 11pt 장평 85%), 출판사명·가격(13pt → 10pt 장평 90%): 한 줄에 들어가도록
    header, name_cp = add_char_pr(header, 15, 1100, 85)
    header, small_cp = add_char_pr(header, 13, 1000, 90)
    return header, {"nameCP": name_cp, "smallCP": small_cp}


def form3_extra(header):
    # 추천 의견: 13pt → 11pt, 양쪽 정렬 문단
    header, op_cp = add_char_pr(header, 16, 1100, 100)
    header, op_pp = add_para_pr(header, 1, "JUSTIFY")
    return header, {"opCP": op_cp, "opPP": op_pp}


def main():
    tpl = {"f1": form1(), "f2": fill_template("form2.hwpx", form2_extra), "f3": fill_template("form3.hwpx", form3_extra)}
    payload = json.dumps(tpl, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TARGET.read_text(encoding="utf-8")
    if not BLOCK.search(html):
        raise SystemExit(f'{TARGET}: <script type="application/json" id="hwpxTpl"> 블록이 없습니다.')
    TARGET.write_text(BLOCK.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1), encoding="utf-8")
    print(f"updated {TARGET.relative_to(ROOT)} ({len(payload):,} chars)")
    for k in ("f2", "f3"):
        t = tpl[k]
        print(f"  {k}: {len(t['paras'])} paragraphs, table at {t['tblPara']}, rows {t['rows']}, "
              f"heights {[p['h'] for p in t['protos']]}, markers {sum(p['xml'].count('§P:') for p in t['protos'])}")


if __name__ == "__main__":
    main()
