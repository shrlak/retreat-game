"""Per-phase backgrounds for 빛의 원정대 (biblical storybook look).

Run from anywhere:  python3 build_phases.py
Writes into the assets dir (parent of this _src dir):
  backgrounds/phase-{propose,vote,mission,lady,assassin,wait}.svg

Layout contract: portrait 600x1300, preserveAspectRatio="xMidYMid slice".
The UI puts text, player chips and cards over the middle ~60% (y 260..1040),
so that band stays calm and low-contrast; the scene lives in the top ~25%
and the bottom ~20%.

Performance rules: only transform/opacity animate, 6-12 animated elements
per file, no SVG filters, no animated gradients, never an animation class on
an element that carries a transform attribute (wrapped in <g transform><g class>),
all motion stops under prefers-reduced-motion. Every id is file-prefixed.
"""
import math
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ASSETS = os.path.dirname(HERE)

from lib import P, svg, lin, rad, glow_def, sparkle_star, dove, sheep, flame, figure  # noqa: E402,F401

BG_ATTR = 'preserveAspectRatio="xMidYMid slice"'
W, H = 600, 1300

ANIM_RE = re.compile(r'class="([a-z0-9]+)"')
LIB_ANIM = {"tw", "tw2", "tw3", "fl", "glow", "drift", "bob", "shim", "spin"}


def write(rel, text):
    path = os.path.join(ASSETS, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    n = sum(1 for c in ANIM_RE.findall(text) if c in LIB_ANIM or c[:2] in OWN_PREFIXES)
    print(f"{rel:34s} {len(text.encode()) / 1024:6.1f} KB  anim={n}")


OWN_PREFIXES = {"pp", "pv", "pm", "pl", "pa", "pw"}


class Motion:
    """Collects file-local keyframes; every class gets a reduced-motion stop."""

    def __init__(self, p):
        self.p = p
        self.rules = []
        self.classes = []

    def add(self, name, rule, keyframes):
        cls = f"{self.p}{name}"
        self.rules.append(f".{cls}{{{rule}}}@keyframes {cls}k{{{keyframes}}}".replace("@@", cls + "k"))
        self.classes.append(cls)
        return cls

    def style(self):
        if not self.classes:
            return ""
        stop = ",".join("." + c for c in self.classes)
        return (f"<style>{''.join(self.rules)}"
                f"@media (prefers-reduced-motion:reduce){{{stop}{{animation:none}}}}</style>")


# ------------------------------------------------------------ shapes
def smooth(pts, close_bottom=None):
    """Catmull-Rom spline through pts -> cubic path; optionally closed down to y."""
    d = [f"M{pts[0][0]:.1f},{pts[0][1]:.1f}"]
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}")
    if close_bottom is not None:
        d.append(f"L{pts[-1][0]:.1f},{close_bottom} L{pts[0][0]:.1f},{close_bottom} Z")
    return " ".join(d)


def starfield(seed, n, box, color="#FFF6D8", rmin=0.8, rmax=2.2, sparkle=0.12, anim_frac=0.45,
              groups=("tw", "tw2")):
    """Stars split into one static group and a few animated groups."""
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    buckets = {g: [] for g in ("",) + tuple(groups)}
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        r = rnd.uniform(rmin, rmax)
        g = rnd.choice(groups) if (groups and rnd.random() < anim_frac) else ""
        if rnd.random() < sparkle:
            buckets[g].append(sparkle_star(x, y, r * 3, color))
        else:
            buckets[g].append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>')
    out = []
    for g, items in buckets.items():
        if items:
            cls = f' class="{g}"' if g else ""
            out.append(f'<g fill="{color}"{cls}>{"".join(items)}</g>')
    return "".join(out)


def olive_tree(x, base, s, trunk, leaf, leaf2, hi=None):
    S = lambda v: v * s
    t = (f'M{x-S(9):.1f},{base:.1f} C{x-S(6):.1f},{base-S(30):.1f} {x-S(18):.1f},{base-S(44):.1f} {x-S(10):.1f},{base-S(66):.1f} '
         f'L{x-S(26):.1f},{base-S(86):.1f} L{x-S(20):.1f},{base-S(90):.1f} L{x-S(4):.1f},{base-S(74):.1f} '
         f'L{x+S(2):.1f},{base-S(94):.1f} L{x+S(9):.1f},{base-S(92):.1f} L{x+S(8):.1f},{base-S(70):.1f} '
         f'L{x+S(26):.1f},{base-S(84):.1f} L{x+S(30):.1f},{base-S(78):.1f} L{x+S(12):.1f},{base-S(58):.1f} '
         f'C{x+S(4):.1f},{base-S(40):.1f} {x+S(14):.1f},{base-S(24):.1f} {x+S(11):.1f},{base:.1f}Z')
    blobs = [(-34, -96, 30, 20), (0, -112, 36, 24), (34, -98, 30, 20), (-52, -78, 22, 15), (52, -80, 22, 15),
             (-14, -88, 28, 16), (18, -86, 28, 16)]
    c = "".join(f'<ellipse cx="{x+S(bx):.1f}" cy="{base+S(by):.1f}" rx="{S(rx):.1f}" ry="{S(ry):.1f}"/>' for bx, by, rx, ry in blobs)
    c2 = "".join(f'<ellipse cx="{x+S(bx):.1f}" cy="{base+S(by-6):.1f}" rx="{S(rx*0.7):.1f}" ry="{S(ry*0.55):.1f}"/>'
                 for bx, by, rx, ry in blobs[:3])
    out = f'<path d="{t}" fill="{trunk}"/><g fill="{leaf}">{c}</g><g fill="{leaf2}">{c2}</g>'
    if hi:
        rnd = random.Random(int(x * 7 + base))
        dots = "".join(f'<ellipse cx="{x+S(rnd.uniform(-50, 50)):.1f}" cy="{base+S(rnd.uniform(-120, -80)):.1f}" rx="{S(3.2):.1f}" ry="{S(1.4):.1f}"/>' for _ in range(9))
        out += f'<g fill="{hi}" opacity=".7">{dots}</g>'
    return out


def palm(x, base, s, col, lean=1):
    S = lambda v: v * s
    L = lambda v: v * s * lean
    trunk = (f'<path d="M{x-S(5):.1f},{base:.1f} Q{x+L(6):.1f},{base-S(70):.1f} {x+L(18):.1f},{base-S(140):.1f} '
             f'L{x+L(24):.1f},{base-S(139):.1f} Q{x+L(14):.1f},{base-S(70):.1f} {x+S(6):.1f},{base:.1f}Z" fill="{col}"/>')
    tx, ty = x + L(21), base - S(140)
    fr = []
    for ang, ln in [(-160, 62), (-130, 54), (-95, 40), (-50, 54), (-20, 62), (10, 50), (170, 50)]:
        a = math.radians(ang)
        ex, ey = tx + S(ln) * math.cos(a), ty + S(ln) * math.sin(a) + S(18)
        mx, my = tx + S(ln * 0.5) * math.cos(a), ty + S(ln * 0.5) * math.sin(a) - S(8)
        fr.append(f'M{tx:.1f},{ty:.1f} Q{mx:.1f},{my - S(6):.1f} {ex:.1f},{ey:.1f} Q{mx:.1f},{my + S(6):.1f} {tx:.1f},{ty:.1f}Z')
    return trunk + f'<path d="{" ".join(fr)}" fill="{col}"/>'


def town(houses, wall, side, roof, win, dome_col=None):
    body, wins = [], []
    for (x, base, w, h, kind) in houses:
        y = base - h
        body.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h+40:.1f}" fill="{wall}"/>')
        body.append(f'<rect x="{x+w*0.72:.1f}" y="{y:.1f}" width="{w*0.28:.1f}" height="{h+40:.1f}" fill="{side}"/>')
        body.append(f'<rect x="{x-2:.1f}" y="{y-4:.1f}" width="{w+4:.1f}" height="5" rx="1.5" fill="{roof}"/>')
        if kind == "dome":
            r = w * 0.32
            body.append(f'<path d="M{x+w*0.5-r:.1f},{y:.1f} A{r:.1f},{r*0.95:.1f} 0 0 1 {x+w*0.5+r:.1f},{y:.1f}Z" fill="{dome_col or roof}"/>')
        if kind == "tower":
            body.append(f'<rect x="{x+w*0.25:.1f}" y="{y-h*0.5:.1f}" width="{w*0.5:.1f}" height="{h*0.5:.1f}" fill="{wall}"/>'
                        f'<rect x="{x+w*0.23:.1f}" y="{y-h*0.5-4:.1f}" width="{w*0.54:.1f}" height="5" rx="1.5" fill="{roof}"/>')
            wins.append(f'<path d="M{x+w*0.44:.1f},{y-h*0.2:.1f} v-6 a{w*0.06:.1f},{w*0.06:.1f} 0 0 1 {w*0.12:.1f},0 v6z"/>')
        nwin = max(1, int(w // 22))
        for k in range(nwin):
            wx = x + w * (0.18 + 0.5 * k / max(1, nwin))
            wy = y + h * 0.3
            wins.append(f'<path d="M{wx:.1f},{wy+9:.1f} v-6 a3.5,3.5 0 0 1 7,0 v6z"/>')
        body.append(f'<path d="M{x+w*0.3:.1f},{base+2:.1f} v-{h*0.32:.1f} a{w*0.09:.1f},{w*0.09:.1f} 0 0 1 {w*0.18:.1f},0 v{h*0.32:.1f}z" fill="{side}"/>')
    return "".join(body), f'<g fill="{win}">{"".join(wins)}</g>'


def cloud(cx, cy, s, fill, op=1.0):
    puffs = [(-62, 10, 26), (-34, -10, 34), (0, -22, 40), (36, -8, 34), (66, 10, 24), (0, 8, 30)]
    c = "".join(f'<circle cx="{cx+px*s:.1f}" cy="{cy+py*s:.1f}" r="{pr*s:.1f}"/>' for px, py, pr in puffs)
    base = f'<rect x="{cx-86*s:.1f}" y="{cy+2*s:.1f}" width="{172*s:.1f}" height="{32*s:.1f}" rx="{16*s:.1f}"/>'
    return f'<g fill="{fill}" opacity="{op}">{c}{base}</g>'


def tall_star(x, y, rx, ry, color):
    k = min(rx, ry) * 0.16
    d = (f"M{x:.1f},{y-ry:.1f} Q{x+k:.1f},{y-k:.1f} {x+rx:.1f},{y:.1f} Q{x+k:.1f},{y+k:.1f} {x:.1f},{y+ry:.1f} "
         f"Q{x-k:.1f},{y+k:.1f} {x-rx:.1f},{y:.1f} Q{x-k:.1f},{y-k:.1f} {x:.1f},{y-ry:.1f}Z")
    return f'<path d="{d}" fill="{color}"/>'


def oil_lamp(x, y, s, clay="#B86A3C", clay_d="#7E4426", hi="#E0A070", flame_s=None):
    """Biblical clay oil lamp, nozzle to the right; (x, y) = base centre.
    Returns (svg, flame_tip_xy)."""
    S = lambda v: v * s
    body = (f'<path d="M{x-S(40):.1f},{y-S(12):.1f} C{x-S(44):.1f},{y-S(30):.1f} {x+S(10):.1f},{y-S(34):.1f} {x+S(30):.1f},{y-S(24):.1f} '
            f'L{x+S(52):.1f},{y-S(22):.1f} C{x+S(60):.1f},{y-S(20):.1f} {x+S(60):.1f},{y-S(10):.1f} {x+S(52):.1f},{y-S(8):.1f} '
            f'L{x+S(28):.1f},{y-S(2):.1f} C{x+S(12):.1f},{y+S(4):.1f} {x-S(30):.1f},{y+S(4):.1f} {x-S(40):.1f},{y-S(12):.1f}Z" fill="{clay}"/>')
    shade = (f'<path d="M{x-S(40):.1f},{y-S(12):.1f} C{x-S(30):.1f},{y+S(4):.1f} {x+S(12):.1f},{y+S(4):.1f} {x+S(28):.1f},{y-S(2):.1f} '
             f'L{x+S(52):.1f},{y-S(8):.1f} C{x+S(40):.1f},{y-S(2):.1f} {x+S(20):.1f},{y-S(6):.1f} {x-S(2):.1f},{y-S(6):.1f} '
             f'C{x-S(20):.1f},{y-S(6):.1f} {x-S(34):.1f},{y-S(6):.1f} {x-S(40):.1f},{y-S(12):.1f}Z" fill="{clay_d}"/>')
    handle = (f'<path d="M{x-S(38):.1f},{y-S(16):.1f} Q{x-S(60):.1f},{y-S(28):.1f} {x-S(50):.1f},{y-S(4):.1f}" fill="none" '
              f'stroke="{clay}" stroke-width="{S(6):.1f}" stroke-linecap="round"/>')
    hole = (f'<ellipse cx="{x-S(4):.1f}" cy="{y-S(24):.1f}" rx="{S(11):.1f}" ry="{S(4):.1f}" fill="{clay_d}"/>'
            f'<ellipse cx="{x-S(4):.1f}" cy="{y-S(22.5):.1f}" rx="{S(7):.1f}" ry="{S(2.2):.1f}" fill="#3A1E10"/>'
            f'<path d="M{x-S(30):.1f},{y-S(22):.1f} Q{x-S(10):.1f},{y-S(32):.1f} {x+S(20):.1f},{y-S(26):.1f}" fill="none" '
            f'stroke="{hi}" stroke-width="{S(2.5):.1f}" stroke-linecap="round" opacity=".8"/>')
    tip = (x + S(52), y - S(18))
    return handle + body + shade + hole, tip


def crook(x0, y0, x1, y1, col="#6B4227", hi="#9A6A3E", w=7):
    """Shepherd's crook: staff from (x0,y0) up to (x1,y1), hook curling left."""
    d = (f"M{x0},{y0} L{x1},{y1} C{x1-2},{y1-34} {x1-46},{y1-40} {x1-48},{y1-10} "
         f"C{x1-49},{y1+4} {x1-38},{y1+8} {x1-32},{y1-2}")
    return (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="M{x0-2},{y0} L{x1-2},{y1}" fill="none" stroke="{hi}" stroke-width="{w*0.3:.1f}" stroke-linecap="round" opacity=".55"/>')


def vignette(p, strength=0.45, col="#000"):
    return rad(f"{p}vig", [(0, col, 0), (0.62, col, 0), (1, col, strength)], r=0.75)


# ============================================================ propose
def build_propose():
    """조장 picks a team: evening gathering under the tent of meeting."""
    p = "pp"
    m = Motion(p)
    sway = m.add("sw", "transform-box:view-box;animation:ppswk 5.5s ease-in-out infinite alternate",
                 "from{transform:rotate(-2.6deg)}to{transform:rotate(2.6deg)}")
    defs = (
        lin(f"{p}sky", [(0, "#120E2A"), (0.3, "#1B1A40"), (0.58, "#26224C"), (0.7, "#3C2C5C"),
                        (0.77, "#7A4668"), (0.81, "#C9725F"), (0.84, "#EE9F62")])
        + rad(f"{p}lamp", [(0, "#FFD36E", 0.85), (0.3, "#F4A259", 0.38), (1, "#F4A259", 0)])
        + rad(f"{p}warm", [(0, "#F4A259", 0.55), (0.4, "#D9813A", 0.22), (1, "#5B3A7A", 0)])
        + lin(f"{p}glass", [(0, "#FFE9A8"), (1, "#F4A259")])
        + lin(f"{p}top", [(0, "#8C7A6A"), (1, "#6E5C50")])
        + lin(f"{p}front", [(0, "#4A3A3A"), (1, "#2A2030")])
        + lin(f"{p}parch", [(0, "#FFF6E5"), (1, "#E8D2A6")])
        + lin(f"{p}roll", [(0, "#C9A06A"), (0.5, "#F6E7C8"), (1, "#B98A55")], 0, 0, 1, 0)
        + lin(f"{p}val", [(0, "#5A2A2E"), (1, "#7A3B34")])
        + lin(f"{p}floor", [(0, "#3A2A3E"), (1, "#1C1426")])
        + vignette(p, 0.5)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".8">{starfield(71, 46, (40, 110, 560, 560), rmin=0.6, rmax=1.7, sparkle=0.1)}</g>')
    b.append(f'<g opacity=".35">{starfield(72, 22, (40, 560, 560, 900), rmin=0.5, rmax=1.1, sparkle=0, groups=())}</g>')
    # --- horizon: hills, camp tents, palms, warm afterglow
    b.append(f'<ellipse cx="300" cy="1090" rx="460" ry="150" fill="url(#{p}warm)"/>')
    b.append(f'<path d="{smooth([(-20, 1050), (120, 1030), (260, 1048), (400, 1026), (520, 1044), (620, 1032)], 1320)}" fill="#3A2752"/>')
    for (tx, tb, tw, th) in [(150, 1052, 70, 40), (220, 1046, 52, 30), (420, 1044, 60, 34)]:
        b.append(f'<path d="M{tx-tw/2},{tb} L{tx},{tb-th} L{tx+tw/2},{tb}Z" fill="#2A1C40"/>'
                 f'<path d="M{tx-5},{tb} L{tx},{tb-th*0.45} L{tx+5},{tb}Z" fill="#F4A259" opacity=".75"/>')
    b.append(palm(70, 1070, 0.75, "#1E1530", lean=-1))
    b.append(palm(108, 1066, 0.55, "#1E1530"))
    b.append(palm(520, 1066, 0.8, "#1E1530"))
    b.append(palm(560, 1072, 0.6, "#1E1530", lean=-1))
    # --- floor under the tent
    b.append(f'<path d="M0,1100 L600,1100 L600,1300 L0,1300Z" fill="url(#{p}floor)"/>')
    # rug
    b.append(f'<path d="M60,1290 L120,1150 L480,1150 L540,1290Z" fill="#6E2F30" opacity=".75"/>'
             f'<path d="M84,1276 L130,1162 L470,1162 L516,1276Z" fill="none" stroke="#E9B949" stroke-width="3" opacity=".45" stroke-dasharray="10 8"/>')
    # warm light pool from the table lamps
    b.append(f'<ellipse cx="300" cy="1175" rx="330" ry="210" fill="url(#{p}lamp)" class="glow" opacity=".65"/>')
    # --- stone table
    b.append(f'<path d="M64,1204 L536,1204 L536,1300 L64,1300Z" fill="url(#{p}front)"/>'
             f'<path d="M100,1150 L500,1150 L540,1204 L60,1204Z" fill="url(#{p}top)"/>'
             f'<path d="M60,1204 L540,1204" stroke="#B9A08A" stroke-width="3" opacity=".6"/>'
             f'<path d="M100,1150 L500,1150" stroke="#C9B39A" stroke-width="2" opacity=".5"/>')
    b.append('<g stroke="#000" stroke-opacity=".18" stroke-width="2">'
             '<path d="M200,1204 V1300 M340,1204 V1300 M470,1204 V1300 M64,1252 H536"/></g>')
    # scroll unrolled on the table
    b.append(f'<path d="M222,1162 L378,1162 L386,1196 L214,1196Z" fill="url(#{p}parch)"/>'
             f'<rect x="208" y="1156" width="16" height="46" rx="8" fill="url(#{p}roll)" transform="rotate(-8 216 1179)"/>'
             f'<rect x="376" y="1156" width="16" height="46" rx="8" fill="url(#{p}roll)" transform="rotate(8 384 1179)"/>'
             f'<g stroke="#B9832A" stroke-width="2" stroke-linecap="round" opacity=".45">'
             f'<path d="M240,1172 H330 M238,1180 H360 M236,1188 H310"/></g>'
             f'<circle cx="352" cy="1173" r="6" fill="#C8553D" opacity=".85"/>')
    # two clay lamps on the table
    for (lx, ly, s) in [(140, 1186, 0.8), (430, 1184, 0.8)]:
        lamp, (fx, fy) = oil_lamp(lx, ly, s)
        b.append(f'<circle cx="{fx:.1f}" cy="{fy-14:.1f}" r="46" fill="url(#{p}lamp)"/>')
        b.append(lamp)
        b.append(flame(round(fx, 1), round(fy + 2, 1), 0.52))
    # shepherd's crook leaning on the table
    b.append(crook(552, 1300, 506, 1012, col="#5E3A22", hi="#A8763E", w=8))
    # --- tent poles and the striped valance at the top
    for x in (14, 586):
        b.append(f'<rect x="{x-7}" y="0" width="14" height="1300" fill="#2A1A20"/>'
                 f'<rect x="{x-7}" y="0" width="4" height="1300" fill="#5A3A30" opacity=".6"/>')
    stripes = []
    cols = ["#7A3B34", "#C98A3E", "#F1E2C0", "#C98A3E"]
    for i in range(16):
        x = i * 40
        stripes.append(f'<rect x="{x}" y="0" width="40" height="64" fill="{cols[i % 4]}"/>')
    sc = []
    for i in range(11):
        cx = 30 + i * 60
        sc.append(f'M{cx-30},64 Q{cx},112 {cx+30},64Z')
    b.append(f'<g opacity=".95">{"".join(stripes)}</g>'
             f'<rect y="0" width="600" height="64" fill="#1A1020" opacity=".35"/>'
             f'<path d="{" ".join(sc)}" fill="url(#{p}val)"/>'
             f'<path d="M0,64 H600" stroke="#E9B949" stroke-width="4"/>'
             f'<path d="M0,10 H600" stroke="#E9B949" stroke-width="2" opacity=".6"/>')
    tas = "".join(f'<path d="M{30 + i * 60},86 l-4,18 h8z"/><circle cx="{30 + i * 60}" cy="86" r="4"/>' for i in range(10))
    b.append(f'<g fill="#E9B949">{tas}</g>')
    # --- hanging lanterns (sway from their hook)
    for (x, yb, s, delay) in [(120, 214, 0.95, 0), (300, 262, 1.15, -2.1), (480, 196, 0.9, -3.7)]:
        top = 66
        S = lambda v: v * s
        lan = (f'<path d="M{x},{top} V{yb-S(48):.1f}" stroke="#8A5A1C" stroke-width="2"/>'
               f'<circle cx="{x}" cy="{yb-S(18):.1f}" r="{S(70):.1f}" fill="url(#{p}lamp)" opacity=".75"/>'
               f'<path d="M{x-S(10):.1f},{yb-S(48):.1f} h{S(20):.1f} l{S(8):.1f},{S(10):.1f} h{-S(36):.1f}z" fill="#B9832A"/>'
               f'<rect x="{x-S(15):.1f}" y="{yb-S(38):.1f}" width="{S(30):.1f}" height="{S(38):.1f}" rx="{S(7):.1f}" fill="url(#{p}glass)"/>'
               + flame(x, round(yb - S(6), 1), round(0.32 * s, 2), outer="#F6A04D", mid="#FFE08A", core="#FFFBEE")
               + f'<path d="M{x-S(5):.1f},{yb-S(38):.1f} V{yb:.1f} M{x+S(5):.1f},{yb-S(38):.1f} V{yb:.1f}" stroke="#8A5A1C" stroke-width="{S(2):.1f}" opacity=".7"/>'
               f'<path d="M{x-S(18):.1f},{yb:.1f} h{S(36):.1f} l{-S(6):.1f},{S(8):.1f} h{-S(24):.1f}z" fill="#B9832A"/>'
               f'<circle cx="{x}" cy="{yb+S(13):.1f}" r="{S(3):.1f}" fill="#B9832A"/>')
        b.append(f'<g class="{sway}" style="transform-origin:{x}px {top}px;animation-delay:{delay}s">{lan}</g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-propose.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ vote
def build_vote():
    """Everyone votes: court of elders at the city gate, dusk."""
    p = "pv"
    m = Motion(p)
    yes = m.add("yes", "animation:pvyesk 6s ease-in-out infinite", "0%,100%{opacity:.45}50%{opacity:1}")
    no = m.add("no", "animation:pvnok 6s ease-in-out infinite", "0%,100%{opacity:1}50%{opacity:.45}")
    defs = (
        lin(f"{p}sky", [(0, "#151534"), (0.35, "#232450"), (0.6, "#3A2D62"), (0.72, "#5E3A6C"),
                        (0.79, "#A65A6A"), (0.83, "#E3895E")])
        + lin(f"{p}stone", [(0, "#4A3E52"), (1, "#2E2638")])
        + lin(f"{p}jamb", [(0, "#2A2236"), (1, "#1E1828")], 0, 0, 1, 0)
        + lin(f"{p}jamb2", [(0, "#1E1828"), (1, "#2A2236")], 0, 0, 1, 0)
        + rad(f"{p}green", [(0, "#3F9D6B", 0.7), (0.5, "#3F9D6B", 0.26), (1, "#3F9D6B", 0)])
        + rad(f"{p}red", [(0, "#C8553D", 0.62), (0.5, "#C8553D", 0.24), (1, "#C8553D", 0)])
        + rad(f"{p}torch", [(0, "#FFD36E", 0.8), (0.35, "#F4A259", 0.3), (1, "#F4A259", 0)])
        + rad(f"{p}hz", [(0, "#F6A86A", 0.55), (0.5, "#C46A6E", 0.2), (1, "#C46A6E", 0)])
        + lin(f"{p}floor", [(0, "#3A2F44"), (1, "#1A1424")])
        + lin(f"{p}bench", [(0, "#7A6A72"), (1, "#4E4250")])
        + vignette(p, 0.5)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".75">{starfield(81, 40, (70, 130, 530, 600), rmin=0.6, rmax=1.6, sparkle=0.1)}</g>')
    b.append(f'<ellipse cx="300" cy="1075" rx="420" ry="140" fill="url(#{p}hz)"/>')
    # distant hills and a hill town seen through the gate
    b.append(f'<path d="{smooth([(-20, 1060), (120, 1040), (250, 1056), (380, 1034), (500, 1052), (620, 1040)], 1320)}" fill="#3E2E5E"/>')
    houses = [(250, 1048, 26, 18, "flat"), (274, 1042, 22, 24, "dome"), (294, 1038, 26, 20, "flat"),
              (318, 1036, 22, 30, "tower"), (338, 1040, 26, 18, "flat")]
    hb, hw = town(houses, "#4A3A6A", "#3A2E5A", "#5E4C84", "#FFD36E", dome_col="#56467E")
    b.append(hb + f'<g opacity=".85">{hw}</g>')
    b.append(dove(392, 236, 0.5, color="#F3ECF6", flip=True))
    # floor: paving in perspective
    b.append(f'<path d="M0,1110 L600,1110 L600,1300 L0,1300Z" fill="url(#{p}floor)"/>')
    pav = []
    for i in range(-7, 8):
        pav.append(f'M{300 + i * 26},1110 L{300 + i * 110},1300')
    for y in (1128, 1152, 1184, 1226, 1280):
        pav.append(f'M0,{y} H600')
    b.append(f'<path d="{" ".join(pav)}" stroke="#000" stroke-opacity=".22" stroke-width="2" fill="none"/>')
    b.append(f'<path d="M0,1110 H600" stroke="#C9806A" stroke-width="2" opacity=".35"/>')
    # gate jambs (thin, quiet)
    blocks = []
    for y in range(360, 1110, 56):
        blocks.append(f'M0,{y} H62 M538,{y} H600')
    b.append(f'<rect x="0" y="330" width="62" height="780" fill="url(#{p}jamb)"/>'
             f'<rect x="538" y="330" width="62" height="780" fill="url(#{p}jamb2)"/>'
             f'<path d="{" ".join(blocks)}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>'
             f'<path d="M62,340 V1110 M538,340 V1110" stroke="#C9806A" stroke-width="2" opacity=".35"/>')
    # approve / reject side glows (alternate breathing), over the jambs too
    b.append(f'<ellipse cx="0" cy="720" rx="250" ry="560" fill="url(#{p}green)" class="{yes}"/>')
    b.append(f'<ellipse cx="600" cy="720" rx="250" ry="560" fill="url(#{p}red)" class="{no}"/>')
    # arch: stone mass across the top with voussoirs and keystone
    cx, cy, rx, ry = 300, 340, 238, 236
    b.append(f'<path d="M0,0 H600 V340 H{cx+rx} A{rx},{ry} 0 0 0 {cx-rx},340 H0Z" fill="url(#{p}stone)"/>')
    vou = []
    n = 15
    for i in range(1, n):
        a = math.pi * i / n
        x1, y1 = cx - rx * math.cos(a), cy - ry * math.sin(a)
        x2, y2 = cx - (rx + 58) * math.cos(a), cy - (ry + 58) * math.sin(a)
        vou.append(f'M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}')
    b.append(f'<path d="M{cx-rx-58},340 A{rx+58},{ry+58} 0 0 1 {cx+rx+58},340" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3"/>'
             f'<path d="{" ".join(vou)}" stroke="#000" stroke-opacity=".28" stroke-width="3"/>')
    # stone blocks above the arch
    rows = []
    for r_, y in enumerate(range(18, 120, 34)):
        off = 0 if r_ % 2 else 40
        rows.append(f'M0,{y} H600')
        for x in range(off, 600, 80):
            rows.append(f'M{x},{y} V{y + 34}')
    b.append(f'<g clip-path="url(#{p}above)"><path d="{" ".join(rows)}" stroke="#000" stroke-opacity=".2" stroke-width="2"/></g>')
    defs += (f'<clipPath id="{p}above"><path d="M0,0 H600 V140 H{cx+rx+58} A{rx+58},{ry+58} 0 0 0 {cx-rx-58},140 H0Z"/></clipPath>')
    b.append(f'<path d="M{cx-rx},340 A{rx},{ry} 0 0 1 {cx+rx},340" fill="none" stroke="#E9A05C" stroke-width="3" opacity=".55"/>')
    b.append(f'<path d="M282,46 L318,46 L324,110 L276,110Z" fill="#6A5A6E"/>'
             f'<path d="M282,46 L318,46 L324,110 L276,110Z" fill="none" stroke="#E9B949" stroke-width="2.5" opacity=".7"/>'
             f'<path d="M300,64 l7,14 l-7,14 l-7,-14z" fill="#E9B949" opacity=".8"/>')
    # torches at the arch springs
    for tx in (36, 564):
        ty = 392
        b.append(f'<circle cx="{tx}" cy="{ty-34}" r="90" fill="url(#{p}torch)" class="glow"/>')
        b.append(f'<path d="M{tx-8},{ty} L{tx+8},{ty} L{tx+4},{ty+46} L{tx-4},{ty+46}Z" fill="#5A3A22"/>'
                 f'<path d="M{tx-12},{ty-4} h24 l-4,10 h-16z" fill="#8A5A1C"/>')
        b.append(flame(tx, ty - 4, 0.62))
    # benches and the elders
    b.append(f'<path d="M0,1150 L150,1150 L170,1192 L0,1192Z" fill="#3A2F44"/>'
             f'<path d="M600,1150 L450,1150 L430,1192 L600,1192Z" fill="#3A2F44"/>')
    elders = [
        (52, 1218, 0.34, "#6B4E3A", "#4E3828", P["skin2"]),
        (138, 1214, 0.32, "#3F5374", "#2C3C58", P["skin3"]),
        (462, 1214, 0.32, "#5A4A6E", "#40345A", P["skin1"]),
        (548, 1218, 0.34, "#7A5A34", "#5A4022", P["skin4"]),
    ]
    for (ex, eby, s, r1, r2, sk) in elders:
        body, hands, _ = figure(ex, eby, s, r1, r2, sk, "#ECE6DA", style="elder", face="calm",
                                arms=[("L", ex - 22 * s, eby - 104 * s), ("R", ex + 22 * s, eby - 104 * s)],
                                trim="#E9B949" if s > 0.33 else None)
        b.append(body + hands)
    b.append(f'<path d="M0,1186 L176,1186 L180,1212 L0,1212Z" fill="url(#{p}bench)"/>'
             f'<path d="M600,1186 L424,1186 L420,1212 L600,1212Z" fill="url(#{p}bench)"/>'
             f'<path d="M0,1212 H180 V1240 H0Z M600,1212 H420 V1240 H600Z" fill="#2A2234"/>'
             f'<path d="M0,1187 H176 M600,1187 H424" stroke="#E9C8A6" stroke-width="2" opacity=".5"/>')
    # dust motes drifting in the torchlight
    rnd = random.Random(84)
    motes = "".join(f'<circle cx="{rnd.uniform(80, 520):.1f}" cy="{rnd.uniform(1060, 1260):.1f}" r="{rnd.uniform(1, 2.2):.1f}"/>' for _ in range(14))
    b.append(f'<g fill="#FFD9A0" opacity=".55" class="drift">{motes}</g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-vote.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ mission
def build_mission():
    """The chosen team sets out: road through Judean hills toward a city on a hill."""
    p = "pm"
    m = Motion(p)
    sx, sy = 300, 170
    spin = m.add("sp", f"transform-box:view-box;transform-origin:{sx}px {sy}px;animation:pmspk 48s linear infinite",
                 "to{transform:rotate(360deg)}")
    pill = m.add("pl", "animation:pmplk 7s ease-in-out infinite", "0%,100%{opacity:1}50%{opacity:.55}")
    walk = m.add("wk", "animation:pmwkk 1.1s ease-in-out infinite", "0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}")
    defs = (
        lin(f"{p}sky", [(0, "#070B22"), (0.4, "#101838"), (0.66, "#1B2652"), (0.76, "#2B3468"), (0.8, "#463C76")])
        + glow_def(f"{p}halo", "#FFF1C4", 0.85)
        + lin(f"{p}pillar", [(0, "#FFF1C4", 0.32), (0.3, "#FFF1C4", 0.07), (0.8, "#FFF1C4", 0.05), (1, "#FFE2A0", 0.3)])
        + rad(f"{p}city", [(0, "#FFD36E", 0.5), (0.5, "#F4A259", 0.15), (1, "#F4A259", 0)])
        + rad(f"{p}lan", [(0, "#FFD36E", 0.9), (0.35, "#F4A259", 0.35), (1, "#F4A259", 0)])
        + lin(f"{p}road", [(0, "#4A4678"), (1, "#7A6A8E")])
        + lin(f"{p}h3", [(0, "#232B54"), (1, "#151A36")])
        + lin(f"{p}h4", [(0, "#171C3A"), (1, "#0C1024")])
        + rad(f"{p}mist", [(0, "#C9D2E6", 0.22), (0.6, "#A8B3C9", 0.08), (1, "#A8B3C9", 0)])
        + vignette(p, 0.5)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(starfield(91, 80, (8, 8, 592, 520), rmin=0.6, rmax=1.9, sparkle=0.1))
    b.append(f'<g opacity=".4">{starfield(92, 34, (8, 520, 592, 960), rmin=0.5, rmax=1.1, sparkle=0, groups=())}</g>')
    # pillar of light from the star down to the city
    b.append(f'<path d="M{sx-14},{sy} L{sx+14},{sy} L{sx+70},1000 L{sx-70},1000Z" fill="url(#{p}pillar)" class="{pill}"/>')
    b.append(f'<circle cx="{sx}" cy="{sy}" r="74" fill="url(#{p}halo)" class="glow"/>')
    b.append(f'<g class="{spin}">{sparkle_star(sx, sy, 26, "#FFE9A8")}'
             f'<g transform="rotate(45 {sx} {sy})">{sparkle_star(sx, sy, 17, "#FFE9A8")}</g></g>')
    b.append(tall_star(sx, sy, 28, 50, "#FFFBEE") + f'<circle cx="{sx}" cy="{sy}" r="7" fill="#FFFFFF"/>')
    # far hills + city on a hill under the light
    b.append(f'<ellipse cx="300" cy="985" rx="200" ry="80" fill="url(#{p}city)"/>')
    b.append(f'<path d="{smooth([(-20, 1010), (110, 990), (230, 1000), (300, 972), (370, 998), (500, 985), (620, 1000)], 1320)}" fill="#2B3266"/>')
    houses = [(250, 996, 22, 16, "flat"), (270, 988, 20, 22, "dome"), (288, 982, 22, 22, "flat"),
              (308, 980, 18, 28, "tower"), (324, 986, 22, 18, "flat"), (344, 994, 20, 14, "flat")]
    hb, hw = town(houses, "#3E4580", "#323870", "#5A609A", "#FFD36E", dome_col="#4A5090")
    b.append(hb + hw)
    b.append(f'<path d="{smooth([(-20, 1050), (100, 1030), (220, 1046), (360, 1028), (500, 1050), (620, 1036)], 1320)}" fill="#1F2650"/>')
    # winding road from the foreground up to the city
    road = (f"M190,1300 C230,1240 380,1220 400,1160 C414,1116 330,1100 300,1070 "
            f"C286,1054 296,1030 302,1006 L308,1006 C304,1030 300,1052 314,1066 "
            f"C350,1098 452,1118 436,1170 C420,1228 300,1250 410,1300Z")
    b.append(f'<path d="{smooth([(-20, 1100), (150, 1080), (300, 1096), (450, 1074), (620, 1090)], 1320)}" fill="url(#{p}h3)"/>')
    b.append(f'<path d="{road}" fill="url(#{p}road)" opacity=".9"/>')
    b.append(f'<path d="{smooth([(-20, 1190), (70, 1168), (160, 1196), (230, 1260), (250, 1330)])} L-20,1330Z" fill="url(#{p}h4)"/>'
             f'<path d="{smooth([(370, 1330), (420, 1250), (500, 1186), (560, 1172), (620, 1184)])} L620,1330Z" fill="url(#{p}h4)"/>')
    b.append(olive_tree(46, 1222, 1.0, "#0B0F20", "#121830", "#1A2240", hi="#3A4A70"))
    b.append(olive_tree(560, 1210, 0.9, "#0B0F20", "#121830", "#1A2240", hi="#3A4A70"))
    # travellers with lanterns on poles, walking up the road (back view)
    trav = [(372, 1196, 0.2, "#6B4E3A", "#4E3828", 0), (318, 1222, 0.22, "#3F5374", "#2C3C58", -0.35),
            (420, 1232, 0.23, "#7A3B34", "#5A2A26", -0.7)]
    halos = []
    for (tx, ty, s, r1, r2, d) in trav:
        hx, hy = tx + 46 * s * 1.6, ty - 300 * s
        body, hands, _ = figure(tx, ty, s, r1, r2, P["skin2"], "#3A2A20", back=True, hood_col=r2,
                                arms=[("R", tx + 50 * s, ty - 160 * s)])
        pole = (f'<path d="M{tx + 50 * s:.1f},{ty - 150 * s:.1f} L{hx:.1f},{hy:.1f}" stroke="#5A3A22" stroke-width="{12 * s:.1f}" stroke-linecap="round"/>'
                f'<rect x="{hx - 16 * s:.1f}" y="{hy:.1f}" width="{32 * s:.1f}" height="{40 * s:.1f}" rx="{8 * s:.1f}" fill="#FFD36E"/>'
                f'<rect x="{hx - 18 * s:.1f}" y="{hy - 4 * s:.1f}" width="{36 * s:.1f}" height="{8 * s:.1f}" rx="{3 * s:.1f}" fill="#8A5A1C"/>'
                f'<circle cx="{hx:.1f}" cy="{hy + 22 * s:.1f}" r="{9 * s:.1f}" fill="#FFFBEE"/>')
        b.append(f'<g class="{walk}" style="animation-delay:{d}s">{body}{hands}{pole}</g>')
        halos.append(f'<circle cx="{hx:.1f}" cy="{hy + 20 * s:.1f}" r="{230 * s:.1f}"/>')
    b.append(f'<g fill="url(#{p}lan)" class="glow">{"".join(halos)}</g>')
    b.append(f'<g class="drift"><ellipse cx="170" cy="1100" rx="260" ry="34" fill="url(#{p}mist)"/>'
             f'<ellipse cx="470" cy="1060" rx="230" ry="28" fill="url(#{p}mist)"/></g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-mission.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ lady (등불)
def build_lady():
    """등불 inspection: a quiet room lit by one clay oil lamp."""
    p = "pl"
    m = Motion(p)
    lx, ly = 300, 1172          # lamp base
    moth_paths = [
        "0%,100%{transform:translate(0,0)}25%{transform:translate(46px,-34px)}50%{transform:translate(12px,-78px)}75%{transform:translate(-40px,-30px)}",
        "0%,100%{transform:translate(0,0)}30%{transform:translate(-52px,-20px)}60%{transform:translate(-18px,-66px)}85%{transform:translate(30px,-26px)}",
        "0%,100%{transform:translate(0,0)}20%{transform:translate(30px,40px)}55%{transform:translate(70px,-10px)}80%{transform:translate(24px,-48px)}",
        "0%,100%{transform:translate(0,0)}35%{transform:translate(-36px,46px)}65%{transform:translate(-74px,0)}90%{transform:translate(-30px,-40px)}",
    ]
    moths = [m.add(f"m{i}", f"animation:plm{i}k {d}s ease-in-out infinite", kf)
             for i, (kf, d) in enumerate(zip(moth_paths, (7, 9, 8, 10.5)))]
    beam = m.add("bm", "animation:plbmk 9s ease-in-out infinite", "0%,100%{opacity:1}50%{opacity:.5}")
    breathe = m.add("br", "transform-box:fill-box;transform-origin:50% 60%;animation:plbrk 5s ease-in-out infinite",
                    "0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.04);opacity:.82}")
    defs = (
        lin(f"{p}wall", [(0, "#120E1C"), (0.5, "#18121F"), (0.85, "#2A1A22"), (1, "#3A2224")])
        + lin(f"{p}floor", [(0, "#3A2620"), (1, "#140E14")])
        + rad(f"{p}spot", [(0, "#FFE3A0", 0.8), (0.16, "#F4A259", 0.5), (0.5, "#C2643A", 0.16), (1, "#5B3A7A", 0)])
        + rad(f"{p}core", [(0, "#FFF6D8", 0.95), (0.4, "#FFD36E", 0.45), (1, "#F4A259", 0)])
        + lin(f"{p}win", [(0, "#0E1640"), (1, "#24306A")])
        + lin(f"{p}moon", [(0, "#C9D2F0", 0.11), (1, "#C9D2F0", 0)])
        + lin(f"{p}shL", [(0, "#000", 0), (1, "#000", 0.5)], 1, 0, 0, 0)
        + lin(f"{p}shR", [(0, "#000", 0), (1, "#000", 0.5)], 0, 0, 1, 0)
        + lin(f"{p}shU", [(0, "#000", 0), (1, "#000", 0.45)], 0, 1, 0, 0)
        + lin(f"{p}jar", [(0, "#C47A48"), (0.6, "#8E4E2E"), (1, "#5A2E1C")], 0, 0, 1, 0)
        + lin(f"{p}ledge", [(0, "#6A4E44"), (1, "#3A2A28")])
        + glow_def(f"{p}moth", "#FFE9A8", 0.9)
        + vignette(p, 0.55)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}wall)"/>']
    # faint plaster texture: stone courses on the wall (very low contrast)
    rows = []
    for r_, y in enumerate(range(380, 1100, 62)):
        rows.append(f'M0,{y} H600')
        off = 0 if r_ % 2 else 55
        for x in range(off, 600, 110):
            rows.append(f'M{x},{y} V{y + 62}')
    b.append(f'<path d="{" ".join(rows)}" stroke="#000" stroke-opacity=".18" stroke-width="2"/>')
    # top: arched window with lattice, stars and a crescent moon
    wx0, wx1, wy0, wy1 = 196, 404, 60, 300
    arch = f"M{wx0},{wy1} V{wy0 + 104} A104,104 0 0 1 {wx1},{wy0 + 104} V{wy1}Z"
    defs += f'<clipPath id="{p}wclip"><path d="{arch}"/></clipPath>'
    b.append(f'<path d="M{wx0 - 22},{wy1 + 22} V{wy0 + 104} A126,126 0 0 1 {wx1 + 22},{wy0 + 104} V{wy1 + 22}Z" fill="#2E2230"/>')
    b.append(f'<path d="{arch}" fill="url(#{p}win)"/>')
    b.append(f'<g clip-path="url(#{p}wclip)">'
             f'{starfield(101, 24, (wx0, wy0, wx1, wy1), rmin=0.7, rmax=1.8, sparkle=0.15, groups=("tw",))}'
             f'<circle cx="350" cy="120" r="22" fill="#F3ECD6"/><circle cx="361" cy="113" r="20" fill="url(#{p}win)"/>'
             f'</g>')
    lat = []
    for x in range(wx0 + 34, wx1, 34):
        lat.append(f'M{x},{wy0} V{wy1}')
    for y in range(wy0 + 40, wy1, 40):
        lat.append(f'M{wx0},{y} H{wx1}')
    b.append(f'<g clip-path="url(#{p}wclip)"><path d="{" ".join(lat)}" stroke="#2E2230" stroke-width="6"/></g>')
    b.append(f'<path d="{arch}" fill="none" stroke="#B9832A" stroke-width="3" opacity=".55"/>')
    b.append(f'<path d="M{wx0 - 30},{wy1 + 22} H{wx1 + 30} V{wy1 + 38} H{wx0 - 30}Z" fill="#3E2E34"/>')
    # cool moonbeam slanting down from the window (quiet)
    b.append(f'<path d="M{wx0},{wy1} L{wx1},{wy1} L{wx1 + 150},980 L{wx0 + 40},980Z" fill="url(#{p}moon)" class="{beam}"/>')
    # floor and the lamp's pool of light
    b.append(f'<path d="M0,1120 H600 V1300 H0Z" fill="url(#{p}floor)"/>')
    b.append(f'<path d="M0,1120 H600" stroke="#7A4A34" stroke-width="2" opacity=".5"/>')
    b.append(f'<g class="{breathe}"><ellipse cx="{lx}" cy="{ly - 40}" rx="520" ry="420" fill="url(#{p}spot)"/></g>')
    # long soft shadows cast away from the lamp
    b.append(f'<path d="M130,1170 L176,1170 L60,880 L-60,900Z" fill="url(#{p}shL)" opacity=".9"/>'
             f'<path d="M446,1176 L500,1176 L660,900 L560,880Z" fill="url(#{p}shR)" opacity=".9"/>'
             )
    # water jar (left) and stacked scrolls (right)
    b.append(f'<path d="M134,1176 C108,1150 106,1090 128,1066 L132,1048 L124,1040 H184 L176,1048 L180,1066 '
             f'C202,1090 200,1150 174,1176Z" fill="url(#{p}jar)"/>'
             f'<path d="M124,1040 H184" stroke="#E0A070" stroke-width="4" stroke-linecap="round"/>'
             f'<path d="M118,1100 Q154,1112 190,1100" fill="none" stroke="#E0A070" stroke-width="2.5" opacity=".6"/>'
             f'<path d="M184,1060 Q206,1070 194,1096" fill="none" stroke="#8E4E2E" stroke-width="6" stroke-linecap="round"/>')
    sc = []
    for (cx, cy, w) in [(474, 1166, 84), (466, 1146, 76), (478, 1126, 64)]:
        sc.append(f'<rect x="{cx - w / 2}" y="{cy - 10}" width="{w}" height="20" rx="10" fill="#E8D2A6"/>'
                  f'<rect x="{cx - w / 2}" y="{cy - 10}" width="{w}" height="7" rx="3.5" fill="#FFF6E5" opacity=".6"/>'
                  f'<ellipse cx="{cx + w / 2 - 8}" cy="{cy}" rx="7" ry="10" fill="#C9A06A"/>'
                  f'<ellipse cx="{cx + w / 2 - 8}" cy="{cy}" rx="3" ry="4.5" fill="#8A5A1C"/>')
    b.append("".join(sc) + '<rect x="466" y="1118" width="7" height="58" fill="#C8553D" opacity=".85"/>')
    # stone ledge + the one lamp
    b.append(f'<path d="M206,1180 H394 L404,1204 H196Z" fill="url(#{p}ledge)"/>'
             f'<path d="M196,1204 H404 V1236 H196Z" fill="#2A1C1E"/>'
             f'<path d="M206,1180 H394" stroke="#D9A070" stroke-width="2.5" opacity=".7"/>')
    lamp, (fx, fy) = oil_lamp(lx - 26, ly + 6, 1.3)
    b.append(f'<circle cx="{fx:.1f}" cy="{fy - 22:.1f}" r="90" fill="url(#{p}core)" class="glow"/>')
    b.append(lamp)
    b.append(flame(round(fx, 1), round(fy + 2, 1), 0.72))
    # moths of light circling the flame
    for i, (dx, dy, r) in enumerate([(-34, -96, 1), (52, -70, 0.85), (-70, -40, 0.75), (84, -120, 0.9)]):
        mx, my = fx + dx, fy + dy
        b.append(f'<g class="{moths[i]}"><circle cx="{mx:.1f}" cy="{my:.1f}" r="{12 * r:.1f}" fill="url(#{p}moth)"/>'
                 f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{2.4 * r:.1f}" fill="#FFFBEE"/></g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-lady.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ assassin (정탐꾼)
def build_assassin():
    """Final guess: Jericho-like wall at violet night, scarlet cord, sweeping moonbeam."""
    p = "pa"
    m = Motion(p)
    mx, my = 438, 150
    swing = m.add("sw", f"transform-box:view-box;transform-origin:{mx}px {my}px;animation:paswk 10s ease-in-out infinite alternate",
                  "from{transform:rotate(-12deg)}to{transform:rotate(12deg)}")
    cord_x, cord_y = 404, 1078
    cord = m.add("cd", f"transform-box:view-box;transform-origin:{cord_x}px {cord_y}px;animation:pacdk 4.5s ease-in-out infinite alternate",
                 "from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}")
    defs = (
        lin(f"{p}sky", [(0, "#0C0720"), (0.4, "#1A1036"), (0.68, "#2A1A4C"), (0.78, "#3E2664")])
        + rad(f"{p}halo", [(0, "#F1E8FB", 0.7), (0.4, "#B48CE0", 0.28), (1, "#B48CE0", 0)])
        + rad(f"{p}moon", [(0, "#FFF8E6"), (0.7, "#F1E6CA"), (1, "#D6C6E6")], cx=0.42, cy=0.4, r=0.65)
        + lin(f"{p}beam", [(0, "#EFE4FB", 0.3), (0.5, "#D9C8F2", 0.1), (1, "#D9C8F2", 0)])
        + lin(f"{p}wall", [(0, "#4A3466"), (1, "#24183A")])
        + lin(f"{p}wall2", [(0, "#3A2856"), (1, "#1C1230")])
        + rad(f"{p}win", [(0, "#FFD36E", 0.85), (0.4, "#F4A259", 0.3), (1, "#F4A259", 0)])
        + rad(f"{p}torch", [(0, "#FFD36E", 0.7), (0.4, "#F4A259", 0.22), (1, "#F4A259", 0)])
        + lin(f"{p}cord", [(0, "#E0563F"), (1, "#A8322A")], 0, 0, 1, 0)
        + vignette(p, 0.55, "#07040F")
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(starfield(111, 70, (8, 8, 592, 560), color="#EFE4FB", rmin=0.6, rmax=1.8, sparkle=0.1))
    b.append(f'<g opacity=".35">{starfield(112, 26, (8, 560, 592, 950), color="#EFE4FB", rmin=0.5, rmax=1.1, sparkle=0, groups=())}</g>')
    # moon + halo
    b.append(f'<circle cx="{mx}" cy="{my}" r="170" fill="url(#{p}halo)" class="glow"/>')
    b.append(f'<circle cx="{mx}" cy="{my}" r="56" fill="url(#{p}moon)"/>')
    cr = "".join(f'<circle cx="{mx + cx}" cy="{my + cy}" r="{r}"/>' for cx, cy, r in [(-18, -14, 9), (16, 6, 12), (-8, 24, 6), (22, -22, 5)])
    b.append(f'<g fill="#B48CE0" opacity=".16">{cr}</g>')
    # sweeping moonbeam (aimed at the wall, swings +-12deg)
    ang = math.radians(101)
    L, half = 1150, math.radians(9)
    pts = [(mx + 30 * math.cos(ang + a), my + 30 * math.sin(ang + a)) for a in (-half * 0.4, half * 0.4)]
    far = [(mx + L * math.cos(ang + a), my + L * math.sin(ang + a)) for a in (half, -half)]
    beam_d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f} L{pts[1][0]:.1f},{pts[1][1]:.1f} L{far[0][0]:.1f},{far[0][1]:.1f} L{far[1][0]:.1f},{far[1][1]:.1f}Z"
    defs += lin(f"{p}beamg", [(0, "#EFE4FB", 0.2), (0.45, "#D9C8F2", 0.05), (1, "#D9C8F2", 0.0)],
                0, 0, 0, 1)
    b.append(f'<g class="{swing}"><path d="{beam_d}" fill="url(#{p}beamg)"/></g>')
    # thin violet clouds drifting across the moon
    b.append(f'<g class="drift">{cloud(400, 196, 0.42, "#6E4A96", 0.6)}{cloud(300, 226, 0.3, "#5B3A7A", 0.5)}'
             f'{cloud(120, 130, 0.34, "#4B2E6B", 0.55)}</g>')
    # hills behind the city
    b.append(f'<path d="{smooth([(-20, 1000), (140, 980), (300, 996), (460, 972), (620, 990)], 1320)}" fill="#2A1C48"/>')
    # the city wall: outer wall with crenellations, houses built into it
    top = 1030
    cren = [f'M0,{top}']
    for x in range(0, 600, 40):
        cren.append(f'H{x + 22} V{top - 18} H{x + 40} V{top}')
    cren.append('V1300 H0Z')
    b.append(f'<path d="{" ".join(cren)}" fill="url(#{p}wall)"/>')
    # tower left
    b.append(f'<path d="M40,1300 V978 H52 V962 H70 V978 H90 V962 H108 V978 H126 V962 H144 V978 H156 V1300Z" fill="url(#{p}wall2)"/>'
             f'<path d="M92,1040 v-18 a6,6 0 0 1 12,0 v18z" fill="#140C22"/>')
    # Rahab's house in the wall: wall face block + window with warm light
    b.append(f'<path d="M352,{top - 60} H470 V1300 H352Z" fill="#3E2C5A"/>'
             f'<path d="M346,{top - 64} H476 V{top - 56} H346Z" fill="#5E4A80"/>'
             f'<path d="M352,{top - 60} H470" stroke="#B48CE0" stroke-width="2" opacity=".4"/>')
    b.append(f'<circle cx="{cord_x}" cy="{cord_y - 30}" r="70" fill="url(#{p}win)" class="glow"/>')
    b.append(f'<path d="M384,{cord_y} V{cord_y - 46} A20,20 0 0 1 424,{cord_y - 46} V{cord_y}Z" fill="#FFD36E"/>'
             f'<path d="M390,{cord_y} V{cord_y - 44} A14,14 0 0 1 418,{cord_y - 44} V{cord_y}Z" fill="#F4A259" opacity=".55"/>'
             f'<path d="M376,{cord_y} H432 V{cord_y + 8} H376Z" fill="#5E4A80"/>')
    # the scarlet cord hanging from the window
    cord_d = (f"M{cord_x - 2},{cord_y + 2} C{cord_x - 8},{cord_y + 60} {cord_x + 8},{cord_y + 120} {cord_x - 2},1270 "
              f"L{cord_x + 4},1270 C{cord_x + 14},{cord_y + 120} {cord_x - 2},{cord_y + 60} {cord_x + 4},{cord_y + 2}Z")
    twist = "".join(f'<path d="M{cord_x - 3},{y} l7,5" />' for y in range(cord_y + 14, 1262, 16))
    b.append(f'<g class="{cord}"><path d="{cord_d}" fill="url(#{p}cord)"/>'
             f'<g stroke="#7A1E1A" stroke-width="1.6" opacity=".7">{twist}</g>'
             f'<path d="M{cord_x + 1},1268 l-6,16 M{cord_x + 1},1268 l0,18 M{cord_x + 1},1268 l6,16" stroke="#C8553D" stroke-width="3" stroke-linecap="round"/></g>')
    # stone courses on the wall
    rows = []
    for r_, y in enumerate(range(top + 30, 1300, 44)):
        rows.append(f'M0,{y} H352 M470,{y} H600')
        off = 0 if r_ % 2 else 36
        for x in range(off, 600, 72):
            if not 352 <= x <= 470:
                rows.append(f'M{x},{y} V{y + 44}')
    b.append(f'<path d="{" ".join(rows)}" stroke="#000" stroke-opacity=".22" stroke-width="2"/>')
    b.append(f'<path d="M0,{top} H600" stroke="#B48CE0" stroke-width="2" opacity=".25"/>')
    # torches on the battlements
    for tx in (232, 548):
        b.append(f'<circle cx="{tx}" cy="{top - 40}" r="64" fill="url(#{p}torch)"/>'
                 f'<path d="M{tx - 5},{top - 18} h10 l-2,22 h-6z" fill="#3A2440"/>')
        b.append(flame(tx, top - 18, 0.42))
    # palms of the city of palms + a cute hooded spy with a spyglass, bottom-left
    b.append(palm(190, 1300, 1.0, "#120A20"))
    b.append(palm(560, 1300, 0.85, "#120A20", lean=-1))
    body, hands, (hx, hy) = figure(118, 1290, 0.3, "#3A2550", "#2A1A40", P["skin2"], "#2A1A20", style="hood",
                                   face="peek", hood_col="#4B2E6B", arms=[("R", 150, 1212)])
    b.append(body)
    b.append(f'<g transform="rotate(-34 150 1212)"><rect x="146" y="1206" width="34" height="11" rx="4" fill="#B9832A"/>'
             f'<rect x="176" y="1204" width="10" height="15" rx="3" fill="#E9B949"/>'
             f'<rect x="146" y="1206" width="34" height="3.5" rx="1.7" fill="#F8DC8B" opacity=".6"/></g>')
    b.append(hands)
    b.append(f'<g fill="#120A20"><circle cx="40" cy="1300" r="40"/><circle cx="96" cy="1316" r="34"/><circle cx="0" cy="1276" r="36"/></g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-assassin.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ wait
def sleeping_sheep(x, y, s, wool="#E9E3F3", face="#4A4468", cls=""):
    """Curled-up sleeping sheep; (x, y) = ground centre."""
    S = lambda v: v * s
    puffs = [(-46, -20, 22), (-26, -36, 26), (2, -40, 28), (30, -34, 24), (48, -18, 20), (-14, -14, 26), (20, -14, 26)]
    w = "".join(f'<circle cx="{x + S(px):.1f}" cy="{y + S(py):.1f}" r="{S(pr):.1f}"/>' for px, py, pr in puffs)
    base = f'<rect x="{x - S(62):.1f}" y="{y - S(22):.1f}" width="{S(124):.1f}" height="{S(22):.1f}" rx="{S(11):.1f}"/>'
    head = (f'<ellipse cx="{x + S(60):.1f}" cy="{y - S(13):.1f}" rx="{S(23):.1f}" ry="{S(17):.1f}" fill="{face}"/>'
            f'<ellipse cx="{x + S(44):.1f}" cy="{y - S(18):.1f}" rx="{S(11):.1f}" ry="{S(5):.1f}" fill="{face}" transform="rotate(20 {x + S(44):.1f} {y - S(18):.1f})"/>'
            f'<circle cx="{x + S(54):.1f}" cy="{y - S(26):.1f}" r="{S(10):.1f}" fill="{wool}"/>'
            f'<path d="M{x + S(54):.1f},{y - S(12):.1f} q{S(5):.1f},{S(5):.1f} {S(10):.1f},0" fill="none" stroke="#fff" stroke-width="{S(2.6):.1f}" stroke-linecap="round" opacity=".85"/>')
    shade = f'<ellipse cx="{x + S(6):.1f}" cy="{y - S(6):.1f}" rx="{S(54):.1f}" ry="{S(10):.1f}" fill="#000" opacity=".1"/>'
    inner = f'<g fill="{wool}">{w}{base}</g>{shade}{head}'
    if cls:
        inner = f'<g class="{cls}">{inner}</g>'
    return f'<ellipse cx="{x:.1f}" cy="{y + S(2):.1f}" rx="{S(70):.1f}" ry="{S(8):.1f}" fill="#000" opacity=".25"/>' + inner


def build_wait():
    """Waiting for others: a calm, starry shepherds' field with sleeping sheep."""
    p = "pw"
    m = Motion(p)
    breathe = m.add("gl", "transform-box:fill-box;transform-origin:50% 50%;animation:pwglk 9s ease-in-out infinite",
                    "0%,100%{opacity:.55;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}")
    c1 = m.add("c1", "animation:pwc1k 34s ease-in-out infinite alternate", "from{transform:translateX(-40px)}to{transform:translateX(50px)}")
    c2 = m.add("c2", "animation:pwc2k 46s ease-in-out infinite alternate", "from{transform:translateX(40px)}to{transform:translateX(-50px)}")
    sh = m.add("sh", "transform-box:fill-box;transform-origin:50% 100%;animation:pwshk 4.8s ease-in-out infinite",
               "0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.05)}")
    defs = (
        lin(f"{p}sky", [(0, "#0A1030"), (0.4, "#121A42"), (0.68, "#1C2A5A"), (0.78, "#2A3A6E"), (0.82, "#3E4C80")])
        + rad(f"{p}glow", [(0, "#DCE4FF", 0.22), (0.45, "#B4C2F0", 0.08), (1, "#B4C2F0", 0)])
        + glow_def(f"{p}mh", "#F3ECD6", 0.55)
        + lin(f"{p}f1", [(0, "#22305C"), (1, "#18224A")])
        + lin(f"{p}f2", [(0, "#1A2650"), (1, "#111A3A")])
        + lin(f"{p}f3", [(0, "#131C40"), (1, "#0A1028")])
        + rad(f"{p}fire", [(0, "#F4A259", 0.6), (0.4, "#D9813A", 0.2), (1, "#D9813A", 0)])
        + vignette(p, 0.45)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<ellipse cx="300" cy="420" rx="420" ry="420" fill="url(#{p}glow)" class="{breathe}"/>')
    b.append(starfield(121, 90, (8, 8, 592, 540), rmin=0.6, rmax=1.9, sparkle=0.1))
    b.append(f'<g opacity=".4">{starfield(122, 40, (8, 540, 592, 980), rmin=0.5, rmax=1.1, sparkle=0, groups=())}</g>')
    # crescent moon
    b.append(f'<circle cx="150" cy="168" r="110" fill="url(#{p}mh)" class="glow"/>'
             f'<path d="M168,122 A48,48 0 1,0 168,214 A38,38 0 1,1 168,122Z" fill="#F3ECD6"/>')
    # drifting clouds (soft, low contrast)
    b.append(f'<g class="{c1}">{cloud(420, 250, 0.9, "#3A4A80", 0.55)}{cloud(436, 246, 0.6, "#5A6AA0", 0.35)}</g>')
    b.append(f'<g class="{c2}">{cloud(130, 330, 0.7, "#34447A", 0.45)}</g>')
    # rolling field
    b.append(f'<path d="{smooth([(-20, 1040), (120, 1020), (260, 1036), (400, 1012), (520, 1030), (620, 1020)], 1320)}" fill="url(#{p}f1)"/>')
    b.append(olive_tree(470, 1030, 0.5, "#0E1428", "#1C2648", "#26325A", hi="#5A6A96"))
    b.append(olive_tree(520, 1034, 0.38, "#0E1428", "#1C2648", "#26325A"))
    b.append(f'<path d="{smooth([(-20, 1110), (140, 1088), (300, 1108), (460, 1086), (620, 1104)], 1320)}" fill="url(#{p}f2)"/>')
    b.append(f'<path d="{smooth([(-20, 1110), (140, 1088), (300, 1108), (460, 1086), (620, 1104)])}" fill="none" stroke="#5A6AA0" stroke-width="2" opacity=".45"/>')
    b.append(sleeping_sheep(130, 1108, 0.42, wool="#D6D2E8"))
    b.append(sleeping_sheep(392, 1104, 0.36, wool="#D6D2E8"))
    b.append(f'<path d="{smooth([(-20, 1190), (160, 1164), (330, 1186), (500, 1160), (620, 1176)], 1320)}" fill="url(#{p}f3)"/>')
    # shepherd's crook planted by a low, sleepy fire
    b.append(f'<ellipse cx="470" cy="1236" rx="170" ry="100" fill="url(#{p}fire)" class="glow"/>')
    b.append(crook(522, 1250, 522, 1110, col="#4A3020", hi="#8A6040", w=6))
    for i in range(6):
        a = math.pi * (0.1 + 0.8 * i / 5)
        b.append(f'<ellipse cx="{470 - math.cos(a) * 30:.1f}" cy="1250" rx="8" ry="5" fill="#2A2A44"/>')
    b.append(f'<rect x="440" y="1238" width="60" height="9" rx="4.5" fill="#5A3A22" transform="rotate(10 470 1242)"/>')
    b.append(flame(470, 1244, 0.5, outer="#E0884A", mid="#F6B860", core="#FFE7B0"))
    rnd = random.Random(123)
    emb = "".join(f'<circle cx="{470 + rnd.uniform(-40, 40):.1f}" cy="{1244 - rnd.uniform(40, 130):.1f}" r="{rnd.uniform(1, 2):.1f}"/>' for _ in range(7))
    b.append(f'<g fill="#FFD36E" opacity=".75" class="tw3">{emb}</g>')
    # sleeping sheep in the foreground, gently breathing
    b.append(sleeping_sheep(118, 1238, 0.62, wool="#E9E3F3", cls=sh))
    b.append(sleeping_sheep(268, 1268, 0.52, wool="#E2DCEF", cls=sh).replace(f'class="{sh}"', f'class="{sh}" style="animation-delay:-1.6s"'))
    b.append(sleeping_sheep(330, 1206, 0.44, wool="#DCD6EA", cls=sh).replace(f'class="{sh}"', f'class="{sh}" style="animation-delay:-3.1s"'))
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/phase-wait.svg", svg(W, H, m.style() + "".join(b), defs, extra_attr=BG_ATTR))


if __name__ == "__main__":
    build_propose()
    build_vote()
    build_mission()
    build_lady()
    build_assassin()
    build_wait()
