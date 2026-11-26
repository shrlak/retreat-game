"""Backgrounds, patterns and track art for 빛의 원정대.

Run from anywhere:  python3 build_scenes.py
Writes into the assets dir (parent of this _src dir):
  backgrounds/{home,game,victory-good,victory-evil,reveal}.svg
  bg-pattern.svg, bg-pattern-overlay.svg
  track/{quest-board,vote-track,vote-marker,quest-slot,two-fails}.svg
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ASSETS = os.path.dirname(HERE)

from lib import (P, svg, lin, rad, glow_def, stars, sparkle_star, rays, dove,  # noqa: E402
                 sheep, flame, hills)

BG_ATTR = 'preserveAspectRatio="xMidYMid slice"'
W, H = 600, 1300

# quest/vote slot geometry (UI contract)
QUEST_X = [120, 310, 500, 690, 880]
QUEST_Y = 125
QUEST_R = 70
VOTE_X = [140, 320, 500, 680, 860]
VOTE_Y = 80
VOTE_R = 46


def write(rel, text):
    path = os.path.join(ASSETS, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"{rel:36s} {len(text.encode()) / 1024:6.1f} KB")


# ------------------------------------------------------------ helpers
def smooth(pts, close_bottom=None):
    """Catmull-Rom spline through pts -> cubic path. Optionally close to y."""
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


def ridge(seed, y, amp, x0=-20, x1=620, n=7, bottom=1320):
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        x = x0 + (x1 - x0) * i / (n - 1)
        pts.append((x, y + rnd.uniform(-amp, amp)))
    return smooth(pts, bottom)


def pine(x, base, h, color, w=None):
    w = w or h * 0.42
    t = []
    for k in range(3):
        top = base - h + k * h * 0.26
        bot = base - h * 0.18 + k * h * 0.06 - (2 - k) * h * 0.22
        ww = w * (0.55 + k * 0.25)
        t.append(f'M{x:.1f},{top:.1f} L{x+ww/2:.1f},{bot:.1f} Q{x:.1f},{bot+h*0.05:.1f} {x-ww/2:.1f},{bot:.1f}Z')
    t.append(f'M{x-w*0.06:.1f},{base-h*0.2:.1f} h{w*0.12:.1f} V{base:.1f} h{-w*0.12:.1f}Z')
    return f'<path d="{" ".join(t)}" fill="{color}"/>'


def cloud(cx, cy, s, fill, op=1.0, cls=""):
    puffs = [(-30, 6, 18), (-12, -6, 22), (12, -10, 24), (32, 4, 18), (0, 8, 20)]
    c = "".join(f'<circle cx="{cx+px*s:.1f}" cy="{cy+py*s:.1f}" r="{pr*s:.1f}"/>' for px, py, pr in puffs)
    base = f'<rect x="{cx-44*s:.1f}" y="{cy+2*s:.1f}" width="{88*s:.1f}" height="{24*s:.1f}" rx="{12*s:.1f}"/>'
    return f'<g fill="{fill}" opacity="{op}" class="{cls}">{c}{base}</g>'


# ============================================================ home
def build_home():
    p = "hm"
    defs = (
        lin(f"{p}sky", [(0, "#0D1330"), (0.26, "#1A2550"), (0.46, "#2E3470"), (0.6, "#523C7E"),
                        (0.69, "#94587E"), (0.74, "#DB7A6C"), (0.78, "#F4A259"), (0.82, "#FFD08A")])
        + rad(f"{p}hz", [(0, "#FFC27A", 0.75), (0.5, "#F28B6B", 0.25), (1, "#F28B6B", 0)])
        + glow_def(f"{p}fire", "#F4A259", 0.85)
        + glow_def(f"{p}win", "#FFD36E", 0.9)
        + glow_def(f"{p}crs", "#F8DC8B", 0.8)
        + glow_def(f"{p}bulb", "#FFE7A8", 0.9)
        + lin(f"{p}moon", [(0, "#FFF6E5"), (1, "#F3DFAE")], 0, 0, 1, 1)
        + lin(f"{p}near", [(0, "#22234A"), (1, "#121530")])
        + rad(f"{p}vig", [(0, "#000", 0), (0.7, "#000", 0), (1, "#000", 0.35)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    # stars + moon
    b.append(stars(11, 70, 10, 10, 590, 720, rmin=0.8, rmax=2.2, sparkle=0.12))
    b.append(stars(12, 18, 10, 700, 590, 900, color="#FFE9C2", rmin=0.6, rmax=1.4, sparkle=0.0))
    b.append(f'<circle cx="470" cy="150" r="70" fill="url(#{p}crs)" opacity=".45"/>'
             f'<path d="M478,112 A40,40 0 1,0 478,192 A31,31 0 1,1 478,112Z" fill="url(#{p}moon)"/>')
    # horizon glow
    b.append(f'<ellipse cx="300" cy="985" rx="460" ry="170" fill="url(#{p}hz)"/>')
    # far hills + cross
    b.append(f'<path d="{ridge(21, 960, 22)}" fill="#6A4A86" opacity=".75"/>')
    far = smooth([(-20, 990), (120, 965), (260, 985), (380, 955), (470, 925), (560, 950), (620, 970)], 1320)
    b.append(f'<path d="{far}" fill="#463468"/>')
    b.append(f'<circle cx="470" cy="905" r="38" fill="url(#{p}crs)" class="glow"/>'
             f'<g fill="#2B2148"><rect x="468" y="888" width="4.5" height="40" rx="1.5"/>'
             f'<rect x="460" y="898" width="20.5" height="4.5" rx="1.5"/></g>')
    # mid hill
    mid = smooth([(-20, 1035), (90, 1010), (220, 1030), (340, 1040), (460, 1015), (620, 1030)], 1320)
    b.append(f'<path d="{mid}" fill="#2E2A5A"/>')
    # distant pines on mid hill
    for x, h in [(250, 40), (268, 52), (288, 38), (330, 46), (352, 34), (555, 44), (580, 56)]:
        b.append(pine(x, 1040 - (0 if x < 400 else 18), h, "#24224C"))
    # cabins (left) with lit windows
    def cabin(x, y, w, h, roof):
        g = [f'<path d="M{x-8},{y} L{x+w/2},{y-h*0.75} L{x+w+8},{y}Z" fill="{roof}"/>',
             f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#3A2D55"/>',
             f'<rect x="{x}" y="{y}" width="{w}" height="6" fill="#000" opacity=".2"/>']
        wx, wy = x + w * 0.22, y + h * 0.3
        g.append(f'<circle cx="{wx+7}" cy="{wy+7}" r="26" fill="url(#{p}win)" class="glow"/>')
        g.append(f'<rect x="{wx}" y="{wy}" width="14" height="14" rx="2" fill="#FFD36E"/>'
                 f'<path d="M{wx+7},{wy} v14 M{wx},{wy+7} h14" stroke="#3A2D55" stroke-width="1.6"/>')
        dx = x + w * 0.62
        g.append(f'<rect x="{dx}" y="{y+h*0.35}" width="{w*0.2}" height="{h*0.65}" rx="2" fill="#F4A259" opacity=".85"/>')
        return "".join(g)
    b.append(cabin(42, 1004, 70, 40, "#241E44"))
    b.append(cabin(132, 1018, 58, 34, "#231C40"))
    # tents (right)
    def tent(x, y, w, h, col):
        return (f'<circle cx="{x}" cy="{y-h*0.25}" r="{w*0.7}" fill="url(#{p}win)" opacity=".55"/>'
                f'<path d="M{x-w/2},{y} L{x},{y-h} L{x+w/2},{y}Z" fill="{col}"/>'
                f'<path d="M{x},{y-h} L{x+w/2},{y} L{x+w*0.2},{y}Z" fill="#000" opacity=".18"/>'
                f'<path d="M{x-w*0.14},{y} L{x},{y-h*0.55} L{x+w*0.14},{y}Z" fill="#FFD36E"/>'
                f'<path d="M{x},{y-h} l-6,-8 M{x},{y-h} l6,-8" stroke="{col}" stroke-width="2" stroke-linecap="round"/>')
    b.append(tent(420, 1042, 66, 50, "#3C2F62"))
    b.append(tent(500, 1036, 54, 40, "#33295A"))
    # near ground
    near = smooth([(-20, 1095), (120, 1080), (300, 1092), (470, 1078), (620, 1092)], 1320)
    b.append(f'<path d="{near}" fill="url(#{p}near)"/>')
    # big pines framing + string lights
    b.append(pine(26, 1110, 250, "#151735", 120))
    b.append(pine(578, 1110, 270, "#151735", 128))
    a, c = (40, 930), (560, 925)
    sag = 70
    pts = []
    n = 17
    for i in range(n):
        t = i / (n - 1)
        x = a[0] + (c[0] - a[0]) * t
        y = a[1] + (c[1] - a[1]) * t + sag * 4 * t * (1 - t)
        pts.append((x, y))
    b.append(f'<path d="M{a[0]},{a[1]} Q300,{(a[1]+c[1])/2 + sag*2} {c[0]},{c[1]}" fill="none" stroke="#1B1A38" stroke-width="2"/>')
    cols = ["#FFE7A8", "#F4A259", "#F8DC8B", "#F28B6B"]
    clss = ["tw", "tw2", "tw3", ""]
    for i, (x, y) in enumerate(pts[1:-1], 1):
        b.append(f'<g class="{clss[i % 4]}"><circle cx="{x:.1f}" cy="{y+7:.1f}" r="13" fill="url(#{p}bulb)" opacity=".7"/>'
                 f'<ellipse cx="{x:.1f}" cy="{y+7:.1f}" rx="3.6" ry="4.8" fill="{cols[i % 4]}"/></g>'
                 f'<rect x="{x-2:.1f}" y="{y:.1f}" width="4" height="3" fill="#1B1A38"/>')
    # campfire
    fx, fy = 300, 1222
    b.append(f'<ellipse cx="{fx}" cy="{fy-20}" rx="280" ry="200" fill="url(#{p}fire)" class="glow" opacity=".75"/>')
    b.append(f'<ellipse cx="{fx}" cy="{fy+8}" rx="90" ry="16" fill="#F4A259" opacity=".22"/>')
    # sitting logs
    b.append(f'<rect x="120" y="1200" width="90" height="20" rx="10" fill="#2A1F2E" transform="rotate(-12 165 1210)"/>'
             f'<rect x="392" y="1200" width="90" height="20" rx="10" fill="#2A1F2E" transform="rotate(12 437 1210)"/>')
    # stones ring
    for i in range(9):
        ang = math.pi * (0.05 + 0.9 * i / 8)
        sx = fx - math.cos(ang) * 58
        sy = fy + 8 - math.sin(ang) * 4 + 6
        b.append(f'<ellipse cx="{sx:.1f}" cy="{sy:.1f}" rx="11" ry="7" fill="#3E3550"/>')
    b.append(f'<rect x="250" y="1214" width="100" height="14" rx="7" fill="#6B4227" transform="rotate(14 300 1221)"/>'
             f'<rect x="250" y="1214" width="100" height="14" rx="7" fill="#7E5030" transform="rotate(-14 300 1221)"/>')
    b.append(flame(fx, fy, 1.25))
    b.append(flame(fx - 18, fy + 2, 0.7, outer="#F28B6B", cls="fl"))
    b.append(flame(fx + 18, fy + 2, 0.75, outer="#F28B6B", cls="fl"))
    # embers
    rnd = random.Random(31)
    for i in range(10):
        ex = fx + rnd.uniform(-60, 60)
        ey = fy - rnd.uniform(90, 200)
        b.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="{rnd.uniform(1.2, 2.4):.1f}" fill="#FFD36E" class="{rnd.choice(clss[:3])}"/>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/home.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ game
def build_game():
    p = "gm"
    defs = (
        lin(f"{p}sky", [(0, "#0E1328"), (0.55, "#141B33"), (1, "#1E2A4A")])
        + rad(f"{p}warm", [(0, "#F4A259", 0.55), (0.35, "#D9813A", 0.22), (0.7, "#5B3A7A", 0.08), (1, "#5B3A7A", 0)])
        + rad(f"{p}vig", [(0, "#000", 0), (0.65, "#000", 0), (1, "#000", 0.45)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".55">{stars(41, 45, 10, 10, 590, 560, rmin=0.6, rmax=1.7, sparkle=0.06)}</g>')
    b.append(f'<ellipse cx="300" cy="1330" rx="560" ry="520" fill="url(#{p}warm)" class="glow"/>')
    # treeline silhouette, very dark
    tl = smooth([(-20, 1130), (80, 1112), (200, 1126), (320, 1114), (440, 1128), (620, 1110)], 1320)
    b.append(f'<path d="{tl}" fill="#0F1428" opacity=".85"/>')
    for x, h in [(18, 150), (60, 110), (548, 120), (588, 160)]:
        b.append(pine(x, 1140, h, "#0C1124"))
    # log circle silhouettes around an implied fire
    for x, y, r in [(130, 1236, -10), (470, 1236, 10), (300, 1272, 0)]:
        b.append(f'<rect x="{x-52}" y="{y-10}" width="104" height="20" rx="10" fill="#120F1E" transform="rotate({r} {x} {y})"/>')
    b.append(f'<ellipse cx="300" cy="1214" rx="70" ry="12" fill="#F4A259" opacity=".25"/>')
    b.append(flame(300, 1214, 0.7, outer="#E0884A", mid="#F6B860", core="#FFE7B0"))
    rnd = random.Random(42)
    for i in range(12):
        b.append(f'<circle cx="{rnd.uniform(220, 380):.1f}" cy="{rnd.uniform(1000, 1180):.1f}" r="{rnd.uniform(1, 2):.1f}" '
                 f'fill="#FFD36E" opacity=".7" class="{rnd.choice(["tw", "tw2", "tw3"])}"/>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/game.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ victory good
def build_victory_good():
    p = "vg"
    defs = (
        lin(f"{p}sky", [(0, "#22345E"), (0.25, "#3C5A8A"), (0.46, "#7D79A8"), (0.6, "#E08C82"),
                        (0.68, "#F4A259"), (0.74, "#FFD9A0"), (0.8, "#FFF1C9")])
        + rad(f"{p}sun", [(0, "#FFF6E5", 1), (0.25, "#FFE9A8", 0.9), (0.55, "#F8DC8B", 0.35), (1, "#F4A259", 0)])
        + lin(f"{p}h1", [(0, "#A9C98A"), (1, "#7FB07A")])
        + lin(f"{p}h2", [(0, "#7FB07A"), (1, "#5E8F5C")])
        + lin(f"{p}h3", [(0, "#4F8A6E"), (1, "#2F5D50")])
        + rad(f"{p}vig", [(0, "#000", 0), (0.7, "#000", 0), (1, "#1E2A4A", 0.3)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".6">{stars(51, 22, 10, 10, 590, 330, rmin=0.7, rmax=1.6, sparkle=0.15)}</g>')
    sx, sy = 300, 960
    b.append(f'<g class="glow">{rays(sx, sy, 22, 150, 1150, 3.2, "#FFF1C4", 0.16, rot=-90)}</g>')
    b.append(f'<circle cx="{sx}" cy="{sy}" r="520" fill="url(#{p}sun)"/>')
    b.append(f'<circle cx="{sx}" cy="{sy}" r="105" fill="#FFF3CF"/>')
    b.append(f'<circle cx="{sx}" cy="{sy}" r="86" fill="#FFF9EA"/>')
    # soft clouds lit from below
    b.append(cloud(110, 690, 1.4, "#FFE3C2", 0.35, "drift"))
    b.append(cloud(500, 610, 1.1, "#FFE3C2", 0.3, "drift"))
    # hills
    b.append(f'<path d="{smooth([(-20, 990), (140, 950), (300, 985), (450, 945), (620, 975)], 1320)}" fill="url(#{p}h1)"/>')
    b.append(f'<path d="{smooth([(-20, 1060), (110, 1025), (260, 1065), (420, 1035), (620, 1060)], 1320)}" fill="url(#{p}h2)"/>')
    b.append(f'<path d="{smooth([(-20, 1150), (160, 1120), (330, 1160), (500, 1125), (620, 1140)], 1320)}" fill="url(#{p}h3)"/>')
    # sun rim light on first hill
    b.append(f'<path d="{smooth([(-20, 990), (140, 950), (300, 985), (450, 945), (620, 975)])}" fill="none" stroke="#FFF1C4" stroke-width="3" opacity=".6"/>')
    # little trees + sheep
    for x, y, h in [(60, 1035, 46), (82, 1040, 34), (520, 1048, 40)]:
        b.append(pine(x, y, h, "#4F8A6E"))
    b.append(sheep(420, 1100, 0.34))
    b.append(sheep(180, 1120, 0.28))
    # flowers on near hill
    rnd = random.Random(52)
    for i in range(26):
        fx = rnd.uniform(10, 590)
        fy = rnd.uniform(1180, 1290)
        col = rnd.choice(["#FFF6E5", "#F8DC8B", "#F28B82"])
        b.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{rnd.uniform(2.5, 4.5):.1f}" fill="{col}" opacity=".9"/>')
    # doves
    b.append(dove(150, 420, 1.1))
    b.append(dove(455, 330, 0.85, flip=True))
    b.append(dove(510, 520, 0.6, flip=True))
    b.append(dove(90, 600, 0.55))
    b.append(dove(330, 760, 0.5, flip=True))
    # golden sparkles
    for i, (x, y) in enumerate([(60, 300), (540, 220), (250, 250), (380, 560), (70, 830), (540, 800)]):
        b.append(sparkle_star(x, y, 7 + (i % 3) * 2, "#FFF1C4", ["tw", "tw2", "tw3"][i % 3]))
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/victory-good.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ victory evil
def build_victory_evil():
    p = "ve"
    defs = (
        lin(f"{p}sky", [(0, "#100C24"), (0.35, "#24183F"), (0.65, "#3E2862"), (1, "#5B3A7A")])
        + rad(f"{p}halo", [(0, "#E4D6F5", 0.55), (0.4, "#B48CE0", 0.2), (1, "#B48CE0", 0)])
        + rad(f"{p}moon", [(0, "#FFF8E6"), (0.7, "#F3E9C6"), (1, "#D9C8E8")], cx=0.42, cy=0.4, r=0.65)
        + rad(f"{p}fog", [(0, "#E4D6F5", 0.38), (0.6, "#B48CE0", 0.12), (1, "#B48CE0", 0)])
        + rad(f"{p}eye", [(0, "#F8DC8B", 0.9), (1, "#F8DC8B", 0)])
        + rad(f"{p}vig", [(0, "#000", 0), (0.65, "#000", 0), (1, "#0A0718", 0.5)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(stars(61, 60, 10, 10, 590, 820, color="#EFE4FB", rmin=0.7, rmax=2.0, sparkle=0.14))
    mx, my = 300, 330
    b.append(f'<circle cx="{mx}" cy="{my}" r="290" fill="url(#{p}halo)" class="glow"/>')
    b.append(f'<circle cx="{mx}" cy="{my}" r="140" fill="url(#{p}moon)"/>')
    for cx, cy, r, o in [(-48, -36, 22, .16), (40, 10, 30, .12), (-20, 60, 16, .14), (62, -60, 12, .14), (-74, 30, 10, .12)]:
        b.append(f'<circle cx="{mx+cx}" cy="{my+cy}" r="{r}" fill="#B48CE0" opacity="{o}"/>')
    # thin cloud strips crossing the moon
    b.append(f'<g class="drift"><rect x="120" y="380" width="230" height="20" rx="10" fill="#7E57A6" opacity=".55"/>'
             f'<rect x="300" y="414" width="190" height="14" rx="7" fill="#7E57A6" opacity=".45"/></g>')
    # hills
    b.append(f'<path d="{ridge(62, 990, 26)}" fill="#3A2550" opacity=".9"/>')
    b.append(f'<path d="{smooth([(-20, 1070), (120, 1040), (300, 1075), (470, 1045), (620, 1065)], 1320)}" fill="#2A1A40"/>')
    # bushes with peeking playful eyes
    def bush(x, y, s, eyes_cls):
        g = [f'<g fill="#1F1432"><circle cx="{x-26*s:.1f}" cy="{y:.1f}" r="{26*s:.1f}"/>'
             f'<circle cx="{x:.1f}" cy="{y-14*s:.1f}" r="{32*s:.1f}"/><circle cx="{x+28*s:.1f}" cy="{y:.1f}" r="{24*s:.1f}"/>'
             f'<rect x="{x-52*s:.1f}" y="{y:.1f}" width="{104*s:.1f}" height="{26*s:.1f}"/></g>']
        g.append(f'<g class="{eyes_cls}"><circle cx="{x:.1f}" cy="{y-12*s:.1f}" r="{22*s:.1f}" fill="url(#{p}eye)" opacity=".35"/>')
        for ex in (-9, 9):
            g.append(f'<ellipse cx="{x+ex*s:.1f}" cy="{y-12*s:.1f}" rx="{5.4*s:.1f}" ry="{4*s:.1f}" fill="#F8DC8B"/>'
                     f'<circle cx="{x+(ex+2)*s:.1f}" cy="{y-11.5*s:.1f}" r="{2.2*s:.1f}" fill="#2A1A40"/>'
                     f'<path d="M{x+(ex-6)*s:.1f},{y-15*s:.1f} Q{x+ex*s:.1f},{y-19*s:.1f} {x+(ex+6)*s:.1f},{y-15*s:.1f}" '
                     f'fill="#1F1432"/>')
        g.append('</g>')
        return "".join(g)
    b.append(bush(90, 1095, 1.1, "tw2"))
    b.append(bush(505, 1085, 0.95, "tw3"))
    b.append(f'<path d="{smooth([(-20, 1170), (150, 1140), (320, 1175), (480, 1145), (620, 1165)], 1320)}" fill="#1A1030"/>')
    b.append(bush(300, 1210, 0.8, "tw"))
    # fog bands drifting
    for (x, y, rx, ry, cls) in [(160, 760, 340, 70, "drift"), (460, 900, 320, 60, "drift"),
                                (240, 1040, 380, 80, "drift"), (420, 1180, 360, 70, "drift")]:
        b.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#{p}fog)" class="{cls}"/>')
    # floating masks (playful), small and translucent
    def mask(x, y, s, rot):
        return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})" opacity=".75"><g class="bob">'
                f'<path d="M-34,-6 Q-34,-18 -18,-18 Q-6,-18 0,-10 Q6,-18 18,-18 Q34,-18 34,-6 Q34,12 16,12 Q6,12 0,4 Q-6,12 -16,12 Q-34,12 -34,-6Z" fill="#B48CE0"/>'
                f'<ellipse cx="-15" cy="-4" rx="7" ry="5" fill="#2A1A40"/><ellipse cx="15" cy="-4" rx="7" ry="5" fill="#2A1A40"/>'
                f'<path d="M-30,-10 Q-18,-24 -4,-14" fill="none" stroke="#E4D6F5" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>'
                f'</g></g>')
    b.append(mask(110, 560, 1.0, -12))
    b.append(mask(500, 680, 0.8, 14))
    for i, (x, y) in enumerate([(70, 220), (530, 160), (520, 480), (60, 860), (560, 980)]):
        b.append(sparkle_star(x, y, 7 + (i % 3) * 2, "#E4D6F5", ["tw", "tw2", "tw3"][i % 3]))
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/victory-evil.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ reveal
def build_reveal():
    p = "rv"
    # curtain fold gradient (horizontal stripes of light/dark)
    def folds(id_, n, c1, c2):
        stops = []
        for i in range(n + 1):
            stops.append((round(i / n, 3), c1 if i % 2 == 0 else c2))
        return lin(id_, stops, 0, 0, 1, 0)
    defs = (
        lin(f"{p}bg", [(0, "#120E26"), (0.5, "#1B1636"), (1, "#0E0B1F")])
        + rad(f"{p}spot", [(0, "#FFF1C9", 0.42), (0.35, "#F8DC8B", 0.16), (0.7, "#B48CE0", 0.05), (1, "#B48CE0", 0)])
        + lin(f"{p}cone", [(0, "#FFF1C9", 0.0), (0.15, "#FFF1C9", 0.1), (1, "#FFF1C9", 0.02)])
        + folds(f"{p}cl", 8, "#5B3A7A", "#3A2550")
        + folds(f"{p}cr", 8, "#3A2550", "#5B3A7A")
        + lin(f"{p}shL", [(0, "#000", 0), (1, "#000", 0.45)], 0, 0, 1, 0)
        + lin(f"{p}shR", [(0, "#000", 0.45), (1, "#000", 0)], 0, 0, 1, 0)
        + lin(f"{p}val", [(0, "#3A2550"), (1, "#5B3A7A")])
        + lin(f"{p}gold", [(0, "#F8DC8B"), (0.5, "#E9B949"), (1, "#B9832A")])
        + rad(f"{p}floor", [(0, "#F8DC8B", 0.3), (1, "#F8DC8B", 0)])
        + rad(f"{p}vig", [(0, "#000", 0), (0.55, "#000", 0), (1, "#05040D", 0.6)], r=0.72)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}bg)"/>']
    # light cone + spotlight
    b.append(f'<path d="M250,0 L350,0 L560,1150 L40,1150Z" fill="url(#{p}cone)"/>')
    b.append(f'<ellipse cx="300" cy="620" rx="330" ry="470" fill="url(#{p}spot)" class="glow"/>')
    b.append(f'<ellipse cx="300" cy="1120" rx="260" ry="50" fill="url(#{p}floor)"/>')
    # sparkles in the light
    rnd = random.Random(71)
    for i in range(16):
        x = rnd.uniform(140, 460)
        y = rnd.uniform(200, 1050)
        if rnd.random() < 0.3:
            b.append(sparkle_star(x, y, rnd.uniform(4, 7), "#FFF1C9", rnd.choice(["tw", "tw2", "tw3"])))
        else:
            b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(1, 2):.1f}" fill="#FFF1C9" class="{rnd.choice(["tw", "tw2", "tw3"])}"/>')
    # curtains: drape pulled to the side, tied at y~760
    left = ("M-10,0 L150,0 C150,220 132,520 92,740 C80,800 96,850 110,900 C128,1000 150,1180 160,1310 L-10,1310Z")
    right = ("M610,0 L450,0 C450,220 468,520 508,740 C520,800 504,850 490,900 C472,1000 450,1180 440,1310 L610,1310Z")
    b.append(f'<path d="{left}" fill="url(#{p}cl)"/><path d="{left}" fill="url(#{p}shL)"/>')
    b.append(f'<path d="{right}" fill="url(#{p}cr)"/><path d="{right}" fill="url(#{p}shR)"/>')
    # fold highlight lines
    for x0, x1 in [(28, 18), (62, 50), (100, 72)]:
        b.append(f'<path d="M{x0},0 C{x0},300 {x1+10},600 {x1+10},760 C{x1+14},900 {x0+14},1100 {x0+18},1310" fill="none" stroke="#7E57A6" stroke-width="3" opacity=".45"/>')
        b.append(f'<path d="M{600-x0},0 C{600-x0},300 {590-x1},600 {590-x1},760 C{586-x1},900 {586-x0},1100 {582-x0},1310" fill="none" stroke="#7E57A6" stroke-width="3" opacity=".45"/>')
    # tie-backs with tassels
    for x, s in [(96, 1), (504, -1)]:
        b.append(f'<path d="M{x-40*s},{735} Q{x},{760} {x+22*s},{752}" fill="none" stroke="url(#{p}gold)" stroke-width="9" stroke-linecap="round"/>'
                 f'<circle cx="{x+20*s}" cy="752" r="9" fill="url(#{p}gold)"/>'
                 f'<path d="M{x+14*s},758 L{x+10*s},800 L{x+30*s},800 L{x+26*s},758Z" fill="#E9B949"/>'
                 f'<path d="M{x+14*s},790 h{16*s}" stroke="#B9832A" stroke-width="2"/>')
    # valance with scallops and gold trim
    sc = 8
    wv = W / sc
    d = "M-10,0 H610 V96 " + " ".join(
        f"Q{600 - (i + 0.5) * wv:.1f},{150} {600 - (i + 1) * wv:.1f},96" for i in range(sc)) + " L-10,96Z"
    b.append(f'<path d="{d}" fill="url(#{p}val)"/>')
    trim = "M610,96 " + " ".join(
        f"Q{600 - (i + 0.5) * wv:.1f},{150} {600 - (i + 1) * wv:.1f},96" for i in range(sc))
    b.append(f'<path d="{trim}" fill="none" stroke="url(#{p}gold)" stroke-width="5"/>')
    b.append(f'<rect x="-10" y="54" width="620" height="6" fill="#E9B949" opacity=".8"/>')
    for i in range(sc):
        cx = 600 - (i + 0.5) * wv
        b.append(f'<circle cx="{cx:.1f}" cy="124" r="5" fill="#F8DC8B"/>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/reveal.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ pattern
T = 160


def wrap(item, x, y, ext):
    """Place item (drawn around 0,0, extent ext) at x,y, repeating across tile edges."""
    out = []
    for dx in (-T, 0, T):
        for dy in (-T, 0, T):
            px, py = x + dx, y + dy
            if px + ext < 0 or px - ext > T or py + ext < 0 or py - ext > T:
                continue
            out.append(f'<g transform="translate({px:.1f},{py:.1f})">{item}</g>')
    return "".join(out)


def lamp_item(col):
    # little oil lamp with flame
    return (f'<g fill="{col}"><path d="M-14,2 Q-14,10 0,10 Q12,10 18,2 L22,-1 Q16,-2 12,1 Q4,-4 -8,-2 Q-14,-1 -14,2Z"/>'
            f'<rect x="-6" y="10" width="12" height="3" rx="1.5"/>'
            f'<path d="M-14,2 Q-22,0 -20,-6 Q-18,-2 -12,-1Z"/>'
            f'<path d="M20,-2 C17,-6 18,-10 21,-14 C24,-10 24,-6 20,-2Z" opacity="1.3"/></g>')


def sprig_item(col):
    leaves = []
    for i, (t, side) in enumerate([(0.2, 1), (0.38, -1), (0.56, 1), (0.74, -1), (0.92, 0)]):
        x = -16 + 32 * t
        y = 8 - 16 * t
        a = -35 + side * 50 if side else -35
        leaves.append(f'<ellipse cx="{x + side*3:.1f}" cy="{y - 4 + (0 if side else -2):.1f}" rx="6.5" ry="2.6" transform="rotate({a} {x:.1f} {y:.1f})"/>')
    return (f'<g fill="{col}"><path d="M-17,9 Q0,2 16,-8" fill="none" stroke="{col}" stroke-width="1.6" stroke-linecap="round"/>'
            f'{"".join(leaves)}</g>')


def dove_item(col):
    return (f'<g fill="{col}" transform="scale(.42)">'
            f'<path d="M-30,6 Q-8,-4 10,2 Q22,-2 30,-8 Q26,4 16,8 Q4,16 -14,14 Q-24,12 -30,6Z"/>'
            f'<path d="M-6,2 Q-18,-30 6,-40 Q4,-18 12,0Z" opacity=".92"/>'
            f'<path d="M2,4 Q14,-22 34,-26 Q24,-8 16,6Z" opacity=".8"/>'
            f'<path d="M30,-6 L37,-4 L30,-2Z"/></g>')


def pattern_body():
    g = []
    gold = P["gold_l"]
    # doves (white, low opacity)
    g.append(f'<g opacity=".13">{wrap(dove_item("#FFF6E5"), 44, 46, 18)}'
             f'{wrap("<g transform=scale(-1,1)>" + dove_item("#FFF6E5") + "</g>", 122, 128, 18)}</g>')
    # lamps (gold)
    g.append(f'<g opacity=".2">{wrap(lamp_item(P["gold"]), 118, 52, 24)}{wrap(lamp_item(P["gold"]), 38, 128, 24)}</g>')
    # olive sprigs
    g.append(f'<g opacity=".18">{wrap(sprig_item("#9CC48A"), 84, 92, 20)}'
             f'{wrap("<g transform=rotate(140)>" + sprig_item("#9CC48A") + "</g>", 150, 4, 20)}</g>')
    # tiny stars, some on edges to prove wrap
    st = []
    for (x, y, r) in [(10, 22, 4.5), (78, 14, 3), (150, 88, 4), (20, 84, 2.6), (98, 148, 3.6),
                      (64, 116, 2.2), (136, 140, 2.4), (0, 160, 3.2), (82, 60, 2.0), (158, 34, 2.4)]:
        st.append(wrap(sparkle_star(0, 0, r, gold), x, y, r + 1))
    for (x, y) in [(52, 74), (110, 92), (30, 156), (142, 112), (98, 30), (6, 110)]:
        st.append(wrap('<circle r="1.1"/>', x, y, 2))
    g.append(f'<g opacity=".42" fill="{gold}">{"".join(st)}</g>')
    return "".join(g)


def build_patterns():
    body = pattern_body()
    write("bg-pattern.svg", svg(T, T, f'<rect width="{T}" height="{T}" fill="{P["navy"]}"/>' + body, "", anim=False))
    write("bg-pattern-overlay.svg", svg(T, T, body, "", anim=False))


# ============================================================ quest board
def slot_svg(p, cx, cy, r, extra_ring=False, tint="good"):
    """Empty stone/parchment slot. Gradient ids must exist: {p}ring {p}stone."""
    o = []
    if extra_ring:
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r+16}" fill="url(#{p}halo)" class="glow"/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r+9}" fill="none" stroke="#E9B949" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>')
        for k in range(4):
            a = math.radians(45 + 90 * k)
            o.append(sparkle_star(cx + (r + 9) * math.cos(a), cy + (r + 9) * math.sin(a), 6, "#F8DC8B"))
    o.append(f'<circle cx="{cx}" cy="{cy+5}" r="{r}" fill="#5E3B14" opacity=".28"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{p}ring)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.84:.1f}" fill="#8A5A1C" opacity=".55"/>')
    o.append(f'<circle cx="{cx}" cy="{cy+1.5}" r="{r*0.8:.1f}" fill="url(#{p}stone)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.68:.1f}" fill="none" stroke="#B9832A" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" opacity=".55"/>')
    o.append(f'<path d="M{cx-r*0.62:.1f},{cy-r*0.3:.1f} A{r*0.7:.1f},{r*0.7:.1f} 0 0 1 {cx+r*0.1:.1f},{cy-r*0.7:.1f}" fill="none" stroke="#FFFFFF" stroke-width="{r*0.07:.1f}" stroke-linecap="round" opacity=".5"/>')
    return "".join(o)


def slot_defs(p):
    return (lin(f"{p}ring", [(0, "#F8DC8B"), (0.45, "#E9B949"), (1, "#B9832A")], 0, 0, 0.3, 1)
            + rad(f"{p}stone", [(0, "#FFFBF0"), (0.65, "#F6E7C8"), (1, "#E3CC9E")], cx=0.45, cy=0.4, r=0.6)
            + glow_def(f"{p}halo", "#F8DC8B", 0.7))


def build_quest_board():
    p = "qb"
    Wb, Hb = 1000, 240
    defs = (
        lin(f"{p}wood", [(0, "#A06A2C"), (0.5, "#7A4D16"), (1, "#5E3B14")])
        + lin(f"{p}par", [(0, "#FFF8EA"), (0.6, "#F6E7C8"), (1, "#EAD5A8")])
        + lin(f"{p}hl", [(0, "#A9C98A", 0.55), (1, "#7FB07A", 0.35)])
        + lin(f"{p}hd", [(0, "#7FB07A", 0.45), (1, "#5E8F5C", 0.35)])
        + rad(f"{p}sun", [(0, "#FFE9A8", 0.7), (1, "#FFE9A8", 0)])
        + f'<clipPath id="{p}clip"><rect x="16" y="16" width="968" height="208" rx="30"/></clipPath>'
        + slot_defs(p)
    )
    b = [f'<rect x="2" y="6" width="996" height="232" rx="42" fill="#3A2412" opacity=".35"/>',
         f'<rect x="2" y="2" width="996" height="230" rx="42" fill="url(#{p}wood)"/>',
         f'<rect x="8" y="8" width="984" height="218" rx="36" fill="none" stroke="#F8DC8B" stroke-width="2" opacity=".45"/>',
         f'<rect x="16" y="16" width="968" height="208" rx="30" fill="url(#{p}par)"/>']
    sc = []
    sc.append(f'<circle cx="930" cy="40" r="120" fill="url(#{p}sun)"/>')
    sc.append(f'<path d="{smooth([(0, 170), (150, 150), (330, 175), (520, 145), (720, 172), (880, 150), (1000, 165)], 240)}" fill="url(#{p}hl)"/>')
    sc.append(f'<path d="{smooth([(0, 205), (200, 185), (420, 210), (640, 188), (860, 208), (1000, 195)], 240)}" fill="url(#{p}hd)"/>')
    for x, y, h in [(215, 168, 34), (232, 172, 24), (600, 160, 30), (785, 170, 26), (960, 160, 32)]:
        sc.append(f'<g opacity=".4">{pine(x, y, h, "#4F8A6E")}</g>')
    # winding path through slot centres
    pts = [(0, 175)]
    for i, x in enumerate(QUEST_X):
        pts.append((x, QUEST_Y))
        if i < 4:
            mid = (x + QUEST_X[i + 1]) / 2
            pts.append((mid, QUEST_Y + (40 if i % 2 == 0 else -40)))
    pts.append((1000, 80))
    path = smooth(pts)
    sc.append(f'<path d="{path}" fill="none" stroke="#E3CC9E" stroke-width="26" stroke-linecap="round"/>')
    sc.append(f'<path d="{path}" fill="none" stroke="#FFF8EA" stroke-width="14" stroke-linecap="round" opacity=".8"/>')
    sc.append(f'<path d="{path}" fill="none" stroke="#B9832A" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" opacity=".7"/>')
    # small sparkles in sky
    for x, y in [(60, 50), (410, 40), (595, 52), (790, 42)]:
        sc.append(sparkle_star(x, y, 6, "#E9B949", "tw"))
    b.append(f'<g clip-path="url(#{p}clip)">{"".join(sc)}</g>')
    b.append(f'<rect x="16" y="16" width="968" height="208" rx="30" fill="none" stroke="#B9832A" stroke-width="2" opacity=".5"/>')
    # corner studs
    for x, y in [(26, 26), (974, 26), (26, 214), (974, 214)]:
        b.append(f'<circle cx="{x}" cy="{y}" r="5" fill="#F8DC8B" stroke="#7A4D16" stroke-width="1.5"/>')
    for i, x in enumerate(QUEST_X):
        b.append(slot_svg(p, x, QUEST_Y, QUEST_R, extra_ring=(i == 3)))
    write("track/quest-board.svg", svg(Wb, Hb, "".join(b), defs))


def build_quest_slot():
    p = "qs"
    defs = slot_defs(p)
    write("track/quest-slot.svg", svg(200, 200, slot_svg(p, 100, 98, 84), defs, anim=False))


# ============================================================ vote track
def build_vote_track():
    p = "vt"
    defs = (
        lin(f"{p}wood", [(0, "#5A3E2C"), (1, "#2E1F15")])
        + lin(f"{p}brass", [(0, "#F8DC8B"), (0.5, "#E9B949"), (1, "#8A5A1C")], 0, 0, 0.3, 1)
        + rad(f"{p}well", [(0, "#4A3426"), (1, "#22160E")], cx=0.5, cy=0.4, r=0.6)
        + lin(f"{p}warn", [(0, "#E4A1B6"), (0.5, "#B04A6A"), (1, "#5B2A4A")], 0, 0, 0.3, 1)
        + rad(f"{p}wwell", [(0, "#5A2440"), (1, "#2A1022")], cx=0.5, cy=0.4, r=0.6)
        + glow_def(f"{p}wglow", "#C8553D", 0.55)
    )
    b = [f'<rect x="2" y="12" width="996" height="140" rx="70" fill="#000" opacity=".25"/>',
         f'<rect x="2" y="6" width="996" height="146" rx="70" fill="url(#{p}wood)"/>',
         f'<rect x="10" y="14" width="980" height="130" rx="62" fill="none" stroke="#E9B949" stroke-width="2.5" opacity=".6"/>',
         f'<path d="M{VOTE_X[0]},{VOTE_Y} H{VOTE_X[-1]}" stroke="#B9832A" stroke-width="5" stroke-linecap="round" opacity=".7"/>']
    for x in [(VOTE_X[i] + VOTE_X[i + 1]) / 2 for i in range(4)]:
        b.append(f'<path d="M{x},{VOTE_Y-7} l7,7 l-7,7 l-7,-7z" fill="#E9B949" opacity=".8"/>')
    for i, x in enumerate(VOTE_X):
        last = i == 4
        ring = f"url(#{p}warn)" if last else f"url(#{p}brass)"
        well = f"url(#{p}wwell)" if last else f"url(#{p}well)"
        if last:
            b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R+20}" fill="url(#{p}wglow)" class="glow"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y+4}" r="{VOTE_R}" fill="#000" opacity=".3"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R}" fill="{ring}"/>')
        # candle-holder petals around the dish
        for k in range(8):
            a = math.radians(22.5 + 45 * k)
            b.append(f'<circle cx="{x + (VOTE_R-6)*math.cos(a):.1f}" cy="{VOTE_Y + (VOTE_R-6)*math.sin(a):.1f}" r="3" fill="#FFF6E5" opacity=".45"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R*0.74:.1f}" fill="{well}"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R*0.32:.1f}" fill="none" stroke="{"#E4A1B6" if last else "#B9832A"}" stroke-width="2" opacity=".55"/>')
        b.append(f'<path d="M{x-VOTE_R*0.6:.1f},{VOTE_Y-VOTE_R*0.4:.1f} A{VOTE_R*0.72:.1f},{VOTE_R*0.72:.1f} 0 0 1 {x+VOTE_R*0.1:.1f},{VOTE_Y-VOTE_R*0.72:.1f}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>')
    write("track/vote-track.svg", svg(1000, 160, "".join(b), defs))


def build_vote_marker():
    p = "vm"
    defs = (glow_def(f"{p}g", "#F8DC8B", 0.85)
            + lin(f"{p}wax", [(0, "#FFF6E5"), (1, "#F3DFAE")], 0, 0, 1, 0)
            + lin(f"{p}cup", [(0, "#F8DC8B"), (1, "#B9832A")]))
    b = [f'<circle cx="50" cy="46" r="48" fill="url(#{p}g)" class="glow"/>',
         f'<ellipse cx="50" cy="80" rx="26" ry="8" fill="url(#{p}cup)"/>',
         f'<rect x="38" y="48" width="24" height="32" rx="5" fill="url(#{p}wax)"/>',
         f'<path d="M38,54 q4,6 8,0 q3,8 7,1 q4,5 9,-1 V52 H38Z" fill="#FFFFFF" opacity=".75"/>',
         f'<rect x="49" y="42" width="2" height="8" rx="1" fill="#4A3426"/>',
         flame(50, 46, 0.52, outer="#F6A04D", mid="#FFD36E", core="#FFF6D8")]
    write("track/vote-marker.svg", svg(100, 100, "".join(b), defs))


def build_two_fails():
    p = "tf"
    defs = (lin(f"{p}bg", [(0, "#7E57A6"), (1, "#3A2550")], 0, 0, 0.4, 1)
            + lin(f"{p}rim", [(0, "#E4D6F5"), (1, "#8F6CB8")]))
    b = [f'<circle cx="50" cy="52" r="46" fill="#000" opacity=".25"/>',
         f'<circle cx="50" cy="50" r="46" fill="url(#{p}rim)"/>',
         f'<circle cx="50" cy="50" r="40" fill="url(#{p}bg)"/>']
    for cx in (31, 69):
        b.append(cloud(cx, 44, 0.33, "#B8AFCB"))
        b.append(f'<g fill="#E4D6F5" opacity=".55"><circle cx="{cx-6}" cy="40" r="5"/></g>')
        # tiny drops
        b.append(f'<g fill="#8EC5E8"><path d="M{cx-6},58 q-3,5 0,7 q3,-2 0,-7z"/><path d="M{cx+5},58 q-3,5 0,7 q3,-2 0,-7z"/></g>')
    write("track/two-fails.svg", svg(100, 100, "".join(b), defs, anim=False))


if __name__ == "__main__":
    build_home()
    build_game()
    build_victory_good()
    build_victory_evil()
    build_reveal()
    build_patterns()
    build_quest_board()
    build_quest_slot()
    build_vote_track()
    build_vote_marker()
    build_two_fails()
