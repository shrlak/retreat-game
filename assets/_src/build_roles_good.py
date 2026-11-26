"""Good-team role cards: merlin (선지자), percival (파수꾼), servant (빛의 일꾼)."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *  # noqa

OUT = os.path.join(HERE, "..", "roles")
os.makedirs(OUT, exist_ok=True)


def write(name, s):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(s)


# ------------------------------------------------------------------ 선지자
def merlin():
    p = "rme_"
    defs = (
        lin(p + "sky", [(0, "#8CBFE3"), (0.45, "#FFE2AE"), (0.8, "#FFC27E"), (1, "#F6A469")])
        + glow_def(p + "halo", "#FFF7D6", 1)
        + glow_def(p + "orb", "#FFFBE8", 1)
        + rad(p + "orbc", [(0, "#FFFFFF"), (0.55, "#FFF2B8"), (1, "#F6C453")])
        + lin(p + "staff", [(0, "#A8743F"), (1, "#7A4D25")], 0, 0, 1, 0)
    )
    sc = [f'<rect x="30" y="30" width="540" height="650" fill="url(#{p}sky)"/>']
    sc.append(f'<circle cx="300" cy="330" r="330" fill="url(#{p}halo)" class="glow"/>')
    sc.append(rays(300, 330, 16, 60, 460, 4, "#FFF6D2", 0.35, rot=8))
    sc.append(stars(11, 10, 50, 50, 550, 200, "#FFFFFF", 1.5, 2.6, 0.3))
    sc.append(hills([
        ("M30,520 Q120,450 220,490 Q320,430 420,480 Q500,450 570,470 V680 H30Z", "#F0B98A", 0.85),
        ("M30,560 Q140,500 260,545 Q380,505 470,540 Q530,525 570,535 V680 H30Z", "#A9CF97", 1),
        ("M30,610 Q160,570 300,600 Q440,575 570,598 V680 H30Z", "#7FB07A", 1),
    ]))
    # little cross on the far hill
    sc.append('<g fill="#B9832A" opacity=".7"><rect x="72" y="462" width="5" height="32" rx="2"/><rect x="62" y="471" width="25" height="5" rx="2"/></g>')
    sc.append(dove(118, 170, 0.95))
    sc.append(dove(478, 238, 0.7, flip=True))
    sc.append(sheep(105, 600, 0.55))
    body, hands, (hx, hy) = figure(300, 690, 1.12, "#FFF5E2", "#E8D2A9", P["skin2"], "#F7F3EA",
                                   "elder", "calm",
                                   arms=[("L", 176, 330), ("R", 432, 470)],
                                   stole="#5E9ECF", trim="#E9B949")
    sc.append(body)
    # staff
    sc.append(f'<path d="M432,700 L432,320 Q432,268 470,272 Q500,277 494,306 Q489,326 468,320" fill="none" stroke="url(#{p}staff)" stroke-width="13" stroke-linecap="round"/>')
    sc.append('<circle cx="432" cy="430" r="4" fill="#5C3A1C" opacity=".5"/><circle cx="432" cy="560" r="4" fill="#5C3A1C" opacity=".5"/>')
    # orb of light above the raised hand
    sc.append(f'<circle cx="176" cy="282" r="95" fill="url(#{p}orb)" class="glow"/>')
    sc.append(rays(176, 282, 8, 30, 70, 7, "#FFFFFF", 0.7, rot=22))
    sc.append(f'<circle cx="176" cy="282" r="27" fill="url(#{p}orbc)"/>')
    sc.append(sparkle_star(176, 282, 15, "#FFFFFF", "tw"))
    sc.append(sparkle_star(214, 246, 7, "#FFFFFF", "tw2"))
    sc.append(sparkle_star(140, 250, 5, "#FFFFFF", "tw3"))
    sc.append(hands)
    # hand over staff
    sc.append(f'<rect x="420" y="456" width="24" height="10" rx="5" fill="{P["skin2"]}"/>')
    write("merlin.svg", card(p, "good", "".join(sc), defs))


# ------------------------------------------------------------------ 파수꾼
def percival():
    p = "rpe_"
    defs = (
        lin(p + "sky", [(0, "#1E2A4A"), (0.4, "#34507F"), (0.75, "#8C7FA6"), (1, "#F2B880")])
        + glow_def(p + "lamp", "#FFE3A0", 1)
        + rad(p + "glass", [(0, "#FFFBE6"), (0.6, "#FFE08A"), (1, "#F4A259")])
        + lin(p + "wall", [(0, "#B9A48C"), (1, "#8A7764")])
        + lin(p + "horn", [(0, "#F3E2C3"), (1, "#B98E5E")], 0, 0, 1, 0)
        + glow_def(p + "moon", "#FFF6D8", 0.6)
    )
    sc = [f'<rect x="30" y="30" width="540" height="650" fill="url(#{p}sky)"/>']
    sc.append(stars(21, 46, 40, 40, 560, 380, "#FFF6D8", 1.1, 2.8, 0.18))
    sc.append(f'<circle cx="150" cy="130" r="90" fill="url(#{p}moon)"/>')
    sc.append('<path d="M168,92 A44,44 0 1,0 168,168 A34,34 0 1,1 168,92Z" fill="#FFF3CF"/>')
    sc.append(hills([
        ("M30,500 Q130,455 240,480 Q360,440 470,470 Q530,455 570,462 V680 H30Z", "#3D4C78", 1),
        ("M30,535 Q170,500 300,522 Q420,500 570,515 V680 H30Z", "#2C3B63", 1),
    ]))
    # tiny village lights far away
    for x, y in [(90, 520), (110, 516), (340, 512), (360, 518), (512, 506)]:
        sc.append(f'<rect x="{x}" y="{y}" width="7" height="7" rx="1.5" fill="#FFD36E" class="tw2"/>')
    body, hands, (hx, hy) = figure(300, 690, 1.06, P["pine"], "#244A40", P["skin3"], "#3B2A22",
                                   "short", "kind",
                                   arms=[("R", 428, 300), ("L", 206, 470)],
                                   trim="#E9B949")
    # cloak behind the figure
    sc.append('<path d="M232,470 Q180,560 168,700 L432,700 Q420,560 368,470Z" fill="#4F8A6E"/>')
    sc.append(body)
    # lantern glow + lantern held high
    sc.append(f'<circle cx="430" cy="350" r="190" fill="url(#{p}lamp)" class="glow"/>')
    sc.append('<path d="M430,300 L430,318" stroke="#5C3A1C" stroke-width="5" stroke-linecap="round"/>'
              '<path d="M412,320 Q430,300 448,320" fill="none" stroke="#5C3A1C" stroke-width="5"/>')
    sc.append('<rect x="404" y="320" width="52" height="12" rx="5" fill="#6B4A2E"/>')
    sc.append(f'<rect x="409" y="332" width="42" height="56" rx="10" fill="url(#{p}glass)"/>')
    sc.append(flame(430, 380, 0.42, "#F6A04D", "#FFD36E", "#FFFFFF"))
    sc.append('<path d="M409,346 H451 M409,372 H451" stroke="#6B4A2E" stroke-width="3" opacity=".6"/>')
    sc.append('<rect x="404" y="388" width="52" height="11" rx="5" fill="#6B4A2E"/>')
    # ram's horn (shofar) in the other hand
    sc.append(f'<path d="M160,520 Q150,478 186,462 Q222,448 236,470 Q218,462 198,474 Q178,488 184,520 Q176,530 160,520Z" fill="url(#{p}horn)"/>')
    sc.append('<path d="M168,516 Q162,488 186,474" fill="none" stroke="#9C7346" stroke-width="2.5" opacity=".6"/>')
    sc.append(hands)
    # city wall in front
    wall = [f'<path d="M30,560 H570 V680 H30Z" fill="url(#{p}wall)"/>']
    for i, x in enumerate(range(30, 570, 60)):
        wall.append(f'<rect x="{x}" y="530" width="36" height="34" rx="4" fill="#B9A48C"/>')
    for row, y in enumerate(range(578, 680, 26)):
        off = 0 if row % 2 == 0 else 40
        for x in range(30 - off, 570, 80):
            wall.append(f'<rect x="{x+3}" y="{y}" width="74" height="22" rx="5" fill="#000" opacity=".07"/>')
    wall.append('<path d="M30,560 H570" stroke="#D8C7B0" stroke-width="4"/>')
    sc.append("".join(wall))
    sc.append(sparkle_star(500, 80, 10, "#FFFFFF", "tw"))
    write("percival.svg", card(p, "good", "".join(sc), defs))


# --------------------------------------------------------------- 빛의 일꾼
def servant():
    p = "rse_"
    defs = (
        lin(p + "sky", [(0, "#22325C"), (0.45, "#6B5A8C"), (0.8, "#E58F6B"), (1, "#F4B678")])
        + glow_def(p + "can", "#FFE3A0", 1)
        + glow_def(p + "star", "#FFF6D8", 0.9)
    )
    sc = [f'<rect x="30" y="30" width="540" height="650" fill="url(#{p}sky)"/>']
    sc.append(stars(31, 26, 40, 40, 560, 300, "#FFF6D8", 1.0, 2.4, 0.15))
    # one bright star
    sc.append(f'<circle cx="446" cy="128" r="80" fill="url(#{p}star)" class="glow"/>')
    sc.append(sparkle_star(446, 128, 30, "#FFFFFF", "tw"))
    sc.append(sparkle_star(446, 128, 12, "#FFF3C4", ""))
    sc.append(hills([("M30,470 Q140,420 260,452 Q380,415 480,445 Q530,432 570,440 V680 H30Z", "#4A5A7E", 1)]))
    # little stone town (flat roofs, arched lit windows)
    town = []
    for hx_, hw, hh, col in [(40, 70, 70, "#C9A982"), (100, 60, 95, "#D8BC94"), (150, 80, 60, "#B99A74"),
                              (400, 70, 80, "#D8BC94"), (460, 60, 105, "#C9A982"), (512, 70, 66, "#B99A74")]:
        top = 520 - hh
        town.append(f'<rect x="{hx_}" y="{top}" width="{hw}" height="{hh+10}" fill="{col}"/>'
                    f'<rect x="{hx_-3}" y="{top-6}" width="{hw+6}" height="8" rx="2" fill="#A88A66"/>'
                    f'<path d="M{hx_+hw/2-8},{top+hh*0.55:.0f} v-10 a8,8 0 0,1 16,0 v10z" fill="#FFD36E" class="glow"/>')
    town.append('<path d="M116,425 v-12 a14,14 0 0,1 28,0 v12z" fill="#D8BC94"/>')
    sc.append("".join(town))
    for ox, oy, k in [(215, 522, 1.0), (360, 516, 0.85)]:
        sc.append(f'<g transform="translate({ox},{oy}) scale({k})"><path d="M-5,0 Q-9,-30 1,-52 Q7,-30 6,0Z" fill="#6B4A2E"/>'
                  f'<g fill="#6E8F5E"><ellipse cx="-18" cy="-60" rx="26" ry="18"/><ellipse cx="16" cy="-66" rx="28" ry="20"/><ellipse cx="0" cy="-84" rx="24" ry="17"/></g>'
                  f'<g fill="#8FB07A" opacity=".7"><ellipse cx="-10" cy="-70" rx="12" ry="7"/><ellipse cx="18" cy="-78" rx="12" ry="7"/></g></g>')
    sc.append(hills([
        ("M30,530 Q170,500 320,515 Q450,500 570,510 V680 H30Z", "#5B7A4F", 1),
        ("M30,600 Q200,570 320,590 Q460,572 570,585 V680 H30Z", "#6E9A5E", 1),
    ]))
    for i, (x, y) in enumerate([(80, 420), (520, 380), (150, 600), (480, 560), (60, 300)]):
        sc.append(f'<circle cx="{x}" cy="{y}" r="3.5" fill="#FFF3A0" class="{["tw","tw2","tw3"][i%3]}"/>')
    sc.append(f'<circle cx="320" cy="530" r="210" fill="url(#{p}can)" class="glow"/>')
    body, hands, (hx, hy) = figure(280, 690, 1.12, "#C96F4A", "#A85638", P["skin1"], "#2E2420",
                                   "hood", "happy", hood_col="#F3E2C3", trim="#E9B949",
                                   arms=[("L", 252, 574), ("R", 318, 574)])
    sc.append(body)
    sc.append('<path d="M204,612 Q280,630 356,612 L358,628 Q280,646 202,628Z" fill="#E9B949"/>')
    # clay oil lamp held in both hands
    sc.append('<path d="M232,566 Q236,538 280,536 Q318,536 330,550 L356,544 Q364,550 354,560 L330,566 Q300,586 264,584 Q236,582 232,566Z" fill="#B7764A"/>')
    sc.append('<path d="M244,558 Q262,546 290,546 Q310,548 316,556" fill="none" stroke="#8C5634" stroke-width="3"/>')
    sc.append('<ellipse cx="282" cy="544" rx="12" ry="4" fill="#5C3A1C"/>')
    sc.append('<path d="M244,572 Q280,582 318,568" fill="none" stroke="#E3A877" stroke-width="3" opacity=".6"/>')
    sc.append(flame(354, 548, 0.6, "#F6A04D", "#FFD36E", "#FFFFFF"))
    sc.append(hands)
    sc.append(sheep(468, 618, 0.78, cls="bob"))
    write("servant.svg", card(p, "good", "".join(sc), defs))


if __name__ == "__main__":
    merlin()
    percival()
    servant()
    print("good role cards written")
