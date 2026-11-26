"""Backgrounds, patterns and track art for 빛의 원정대 (biblical storybook look).

Run from anywhere:  python3 build_scenes.py
Writes into the assets dir (parent of this _src dir):
  backgrounds/{home,game,victory-good,victory-evil,reveal}.svg
  bg-pattern.svg, bg-pattern-overlay.svg
  track/{quest-board,vote-track,vote-marker,quest-slot,two-fails}.svg

Performance rules kept here: only transform/opacity are animated, few animated
elements per file (stars are grouped so one group = one animated element),
no SVG filters, no animated gradients. An animation class is never put on an
element that also carries a transform attribute (wrap in a <g> instead).
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ASSETS = os.path.dirname(HERE)

from lib import P, svg, lin, rad, glow_def, sparkle_star, dove, sheep, flame  # noqa: E402

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
    print(f"{rel:34s} {len(text.encode()) / 1024:6.1f} KB  anim={anim_count(text)}")


def anim_count(text):
    import re
    return len(re.findall(r'class="(?:tw|tw2|tw3|fl|glow|drift|bob|[a-z]{2}(?:spin|sway|rise))"', text))


def local_style(css):
    """File-local keyframes (class names carry the file prefix)."""
    return f"<style>{css}</style>"


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
              groups=("tw", "tw2", "tw3")):
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
    """Gnarled olive tree. (x, base) = foot of trunk."""
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


def palm(x, base, s, col):
    S = lambda v: v * s
    trunk = f'<path d="M{x-S(5):.1f},{base:.1f} Q{x+S(6):.1f},{base-S(70):.1f} {x+S(18):.1f},{base-S(140):.1f} L{x+S(24):.1f},{base-S(139):.1f} Q{x+S(14):.1f},{base-S(70):.1f} {x+S(6):.1f},{base:.1f}Z" fill="{col}"/>'
    tx, ty = x + S(21), base - S(140)
    fr = []
    for ang, ln in [(-160, 62), (-130, 54), (-95, 40), (-50, 54), (-20, 62), (10, 50), (170, 50)]:
        a = math.radians(ang)
        ex, ey = tx + S(ln) * math.cos(a), ty + S(ln) * math.sin(a) + S(18)
        mx, my = tx + S(ln * 0.5) * math.cos(a), ty + S(ln * 0.5) * math.sin(a) - S(8)
        fr.append(f'M{tx:.1f},{ty:.1f} Q{mx:.1f},{my - S(6):.1f} {ex:.1f},{ey:.1f} Q{mx:.1f},{my + S(6):.1f} {tx:.1f},{ty:.1f}Z')
    return trunk + f'<path d="{" ".join(fr)}" fill="{col}"/>'


def town(houses, wall, side, roof, win, dome_col=None):
    """houses: (x, base, w, h, kind) kind in {flat, dome, tower}. Returns (bodies, windows)."""
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
        # windows: arched slits
        nwin = max(1, int(w // 22))
        for k in range(nwin):
            wx = x + w * (0.18 + 0.5 * k / max(1, nwin))
            wy = y + h * 0.3
            wins.append(f'<path d="M{wx:.1f},{wy+9:.1f} v-6 a3.5,3.5 0 0 1 7,0 v6z"/>')
        # arched door
        body.append(f'<path d="M{x+w*0.3:.1f},{base+2:.1f} v-{h*0.32:.1f} a{w*0.09:.1f},{w*0.09:.1f} 0 0 1 {w*0.18:.1f},0 v{h*0.32:.1f}z" fill="{side}"/>')
    return "".join(body), f'<g fill="{win}">{"".join(wins)}</g>'


def cloud(cx, cy, s, fill, op=1.0):
    puffs = [(-62, 10, 26), (-34, -10, 34), (0, -22, 40), (36, -8, 34), (66, 10, 24), (0, 8, 30)]
    c = "".join(f'<circle cx="{cx+px*s:.1f}" cy="{cy+py*s:.1f}" r="{pr*s:.1f}"/>' for px, py, pr in puffs)
    base = f'<rect x="{cx-86*s:.1f}" y="{cy+2*s:.1f}" width="{172*s:.1f}" height="{32*s:.1f}" rx="{16*s:.1f}"/>'
    return f'<g fill="{fill}" opacity="{op}">{c}{base}</g>'


def ray_fan(cx, cy, angles, length, width_deg, color, op):
    out = []
    for a_deg in angles:
        a = math.radians(a_deg)
        w = math.radians(width_deg / 2)
        x2, y2 = cx + length * math.cos(a - w), cy + length * math.sin(a - w)
        x3, y3 = cx + length * math.cos(a + w), cy + length * math.sin(a + w)
        out.append(f'M{cx},{cy} L{x2:.1f},{y2:.1f} L{x3:.1f},{y3:.1f}Z')
    return f'<path d="{" ".join(out)}" fill="{color}" opacity="{op}"/>'


def tall_star(x, y, rx, ry, color):
    k = min(rx, ry) * 0.16
    d = (f"M{x:.1f},{y-ry:.1f} Q{x+k:.1f},{y-k:.1f} {x+rx:.1f},{y:.1f} Q{x+k:.1f},{y+k:.1f} {x:.1f},{y+ry:.1f} "
         f"Q{x-k:.1f},{y+k:.1f} {x-rx:.1f},{y:.1f} Q{x-k:.1f},{y-k:.1f} {x:.1f},{y-ry:.1f}Z")
    return f'<path d="{d}" fill="{color}"/>'


def bright_star(p, x, y, r):
    """The single big star: halo (glow), long beam, 8-point body, slow spinning sparkle."""
    css = (f".{p}spin{{transform-box:view-box;transform-origin:{x}px {y}px;animation:{p}sp 40s linear infinite}}"
           f"@keyframes {p}sp{{to{{transform:rotate(360deg)}}}}"
           f"@media (prefers-reduced-motion:reduce){{.{p}spin{{animation:none}}}}")
    defs = (glow_def(f"{p}bs", "#FFF1C4", 0.85)
            + lin(f"{p}beam", [(0, "#FFF1C4", 0.55), (1, "#FFF1C4", 0)]))
    body = (local_style(css)
            + f'<g class="glow"><circle cx="{x}" cy="{y}" r="{r*5}" fill="url(#{p}bs)"/>'
            f'<path d="M{x-r*0.35},{y} L{x+r*0.35},{y} L{x+r*1.6},{y+r*20} L{x-r*1.6},{y+r*20}Z" fill="url(#{p}beam)"/></g>'
            + f'<g class="{p}spin">{sparkle_star(x, y, r * 2.1, "#FFE9A8")}'
            f'<g transform="rotate(45 {x} {y})">{sparkle_star(x, y, r * 1.4, "#FFE9A8")}</g></g>'
            + tall_star(x, y, r * 2.4, r * 4.2, "#FFFBEE")
            + f'<circle cx="{x}" cy="{y}" r="{r*0.55}" fill="#FFFFFF"/>')
    return defs, body


# ============================================================ home
def build_home():
    p = "hm"
    sdefs, star = bright_star(p, 400, 215, 12)
    defs = (
        lin(f"{p}sky", [(0, "#0A0F2E"), (0.28, "#17214C"), (0.48, "#2B2E67"), (0.6, "#463574"),
                        (0.69, "#6E447C"), (0.75, "#B0607A"), (0.8, "#E48A62")])
        + rad(f"{p}hz", [(0, "#F6A86A", 0.6), (0.5, "#C46A6E", 0.2), (1, "#C46A6E", 0)])
        + glow_def(f"{p}fire", "#F4A259", 0.8)
        + glow_def(f"{p}win", "#FFD36E", 0.75)
        + lin(f"{p}field", [(0, "#2A2C58"), (1, "#14163A")])
        + lin(f"{p}mist", [(0, "#B48CE0", 0), (0.5, "#C9B5E8", 0.22), (1, "#B48CE0", 0)], 0, 0, 1, 0)
        + rad(f"{p}vig", [(0, "#000", 0), (0.7, "#000", 0), (1, "#000", 0.38)], r=0.75)
        + sdefs
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(starfield(11, 95, (8, 8, 592, 760), rmin=0.7, rmax=2.0, sparkle=0.1))
    b.append(star)
    b.append(f'<ellipse cx="300" cy="975" rx="470" ry="180" fill="url(#{p}hz)"/>')
    # Judean hills, far to near
    b.append(f'<path d="{smooth([(-20, 925), (80, 900), (190, 930), (300, 905), (430, 925), (520, 895), (620, 915)], 1320)}" fill="#5A3F7C" opacity=".8"/>')
    b.append(f'<path d="{smooth([(-20, 965), (100, 940), (220, 962), (340, 948), (470, 970), (620, 945)], 1320)}" fill="#3E3068"/>')
    # town hill rising under the star
    th = smooth([(-20, 1040), (120, 1020), (250, 985), (380, 955), (500, 985), (620, 1010)], 1320)
    b.append(f'<path d="{th}" fill="#30285A"/>')
    houses = [
        (238, 1000, 44, 34, "flat"), (276, 990, 38, 42, "dome"), (308, 980, 46, 36, "flat"),
        (348, 968, 40, 52, "tower"), (384, 962, 46, 40, "flat"), (424, 972, 40, 34, "dome"),
        (458, 985, 46, 30, "flat"), (496, 995, 36, 28, "flat"),
        (258, 1028, 50, 30, "flat"), (302, 1018, 44, 34, "flat"), (340, 1008, 52, 30, "dome"),
        (388, 1004, 46, 34, "flat"), (430, 1012, 50, 28, "flat"), (474, 1020, 40, 26, "flat"),
    ]
    bodies, wins = town(houses, "#4C3F78", "#3B3166", "#6A5A96", "#FFD36E", dome_col="#5C4C8A")
    b.append(bodies)
    # window glows: one animated group
    rnd = random.Random(5)
    glows = "".join(f'<circle cx="{x + w * 0.4:.1f}" cy="{base - h * 0.62:.1f}" r="{rnd.uniform(16, 24):.1f}"/>'
                    for (x, base, w, h, k) in houses[::2])
    b.append(f'<g fill="url(#{p}win)" class="glow" opacity=".8">{glows}</g>')
    b.append(wins)
    # olive grove around the town
    for (x, base, s) in [(205, 1046, 0.42), (540, 1028, 0.5), (580, 1036, 0.36)]:
        b.append(olive_tree(x, base, s, "#241C3E", "#34405E", "#3F4E6C"))
    # shepherds' field (foreground)
    field = smooth([(-20, 1080), (110, 1062), (260, 1078), (420, 1060), (620, 1075)], 1320)
    b.append(f'<path d="{field}" fill="url(#{p}field)"/>')
    b.append(f'<path d="{smooth([(-20, 1080), (110, 1062), (260, 1078), (420, 1060), (620, 1075)])}" fill="none" stroke="#5A4C8A" stroke-width="2" opacity=".6"/>')
    b.append(olive_tree(40, 1150, 1.25, "#14102A", "#1C2240", "#232B4C"))
    b.append(olive_tree(570, 1140, 1.1, "#14102A", "#1C2240", "#232B4C"))
    # stone sheepfold wall
    wall = []
    for i in range(14):
        wall.append(f'<rect x="{360 + i * 17}" y="{1112 + (i % 2) * 2}" width="16" height="12" rx="4"/>')
        wall.append(f'<rect x="{368 + i * 17}" y="{1101 + (i % 2) * 1}" width="15" height="11" rx="4"/>')
    b.append(f'<g fill="#2C2850">{"".join(wall)}</g>')
    # sheep (moonlit wool)
    b.append(sheep(140, 1122, 0.36, wool="#E9E3F3", face="#2A2440"))
    b.append(sheep(470, 1150, 0.4, wool="#E9E3F3", face="#2A2440", cls="bob"))
    b.append(sheep(210, 1176, 0.3, wool="#DCD3EC", face="#2A2440"))
    # campfire with a shepherd's crook planted beside it
    fx, fy = 318, 1232
    b.append(f'<ellipse cx="{fx}" cy="{fy-24}" rx="270" ry="190" fill="url(#{p}fire)" class="glow" opacity=".7"/>')
    b.append(f'<path d="M262,1250 V1100 Q262,1078 280,1078 Q296,1078 296,1094" fill="none" stroke="#5A3A22" stroke-width="6" stroke-linecap="round"/>')
    for i in range(8):
        ang = math.pi * (0.06 + 0.88 * i / 7)
        b.append(f'<ellipse cx="{fx - math.cos(ang) * 54:.1f}" cy="{fy + 12:.1f}" rx="11" ry="7" fill="#3A3150"/>')
    b.append(f'<g transform="rotate(14 {fx} {fy})"><rect x="{fx-48}" y="{fy-6}" width="96" height="13" rx="6.5" fill="#6B4227"/></g>'
             f'<g transform="rotate(-14 {fx} {fy})"><rect x="{fx-48}" y="{fy-6}" width="96" height="13" rx="6.5" fill="#7E5030"/></g>')
    b.append(flame(fx, fy, 1.15))
    b.append(flame(fx - 17, fy + 3, 0.65, outer="#F28B6B"))
    ember = "".join(f'<circle cx="{fx + rnd.uniform(-55, 55):.1f}" cy="{fy - rnd.uniform(90, 190):.1f}" r="{rnd.uniform(1.2, 2.3):.1f}"/>' for _ in range(9))
    b.append(f'<g fill="#FFD36E" class="tw3">{ember}</g>')
    # low mist over the field
    b.append(f'<g class="drift"><rect x="-60" y="1060" width="720" height="44" rx="22" fill="url(#{p}mist)"/></g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/home.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ game
def build_game():
    p = "gm"
    defs = (
        lin(f"{p}sky", [(0, "#0C1128"), (0.55, "#131A33"), (1, "#1C2646")])
        + rad(f"{p}warm", [(0, "#F4A259", 0.5), (0.35, "#D9813A", 0.2), (0.7, "#5B3A7A", 0.07), (1, "#5B3A7A", 0)])
        + rad(f"{p}vig", [(0, "#000", 0), (0.62, "#000", 0), (1, "#000", 0.5)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".55">{starfield(41, 60, (8, 8, 592, 620), rmin=0.6, rmax=1.6, sparkle=0.05, groups=("tw2", "tw3"))}</g>')
    b.append(f'<g opacity=".7">{sparkle_star(452, 140, 9, "#FFF1C4")}</g>')
    b.append(f'<ellipse cx="300" cy="1340" rx="580" ry="540" fill="url(#{p}warm)" class="glow"/>')
    b.append(f'<path d="{smooth([(-20, 1110), (100, 1088), (230, 1104), (360, 1090), (480, 1108), (620, 1092)], 1320)}" fill="#11162C"/>')
    b.append(f'<path d="M150,1098 h26 v-18 h20 v-10 h14 v28 h18 v-14 h16 v14Z" fill="#11162C"/>')
    b.append(olive_tree(30, 1170, 1.15, "#0B0F20", "#101629", "#141B31"))
    b.append(olive_tree(575, 1160, 1.0, "#0B0F20", "#101629", "#141B31"))
    for x, y, r in [(128, 1240, -10), (472, 1240, 10), (300, 1280, 0)]:
        b.append(f'<g transform="rotate({r} {x} {y})"><rect x="{x-52}" y="{y-10}" width="104" height="20" rx="10" fill="#120F1E"/></g>')
    b.append(f'<ellipse cx="300" cy="1218" rx="68" ry="12" fill="#F4A259" opacity=".22"/>')
    b.append(flame(300, 1216, 0.7, outer="#E0884A", mid="#F6B860", core="#FFE7B0"))
    rnd = random.Random(42)
    ember = "".join(f'<circle cx="{rnd.uniform(230, 370):.1f}" cy="{rnd.uniform(1030, 1180):.1f}" r="{rnd.uniform(1, 2):.1f}"/>' for _ in range(10))
    b.append(f'<g fill="#FFD36E" opacity=".75" class="tw">{ember}</g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/game.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ victory good
def build_victory_good():
    p = "vg"
    lx, ly = 300, 470  # light source behind the cloud break
    css = (f".{p}sway{{transform-box:view-box;transform-origin:{lx}px {ly}px;animation:{p}sw 18s ease-in-out infinite alternate}}"
           f"@keyframes {p}sw{{from{{transform:rotate(-4deg)}}to{{transform:rotate(4deg)}}}}"
           f"@media (prefers-reduced-motion:reduce){{.{p}sway{{animation:none}}}}")
    defs = (
        lin(f"{p}sky", [(0, "#253A6A"), (0.22, "#3E5F96"), (0.42, "#7C9CC8"), (0.58, "#E9C8A6"),
                        (0.7, "#FFD9A0"), (0.8, "#FFE9B8")])
        + rad(f"{p}src", [(0, "#FFFBEE", 1), (0.2, "#FFF1C4", 0.85), (0.55, "#F8DC8B", 0.3), (1, "#F8DC8B", 0)])
        + lin(f"{p}ray", [(0, "#FFF6D8", 0.55), (1, "#FFF6D8", 0)])
        + lin(f"{p}cl", [(0, "#F3ECF6"), (0.6, "#E8D8E6"), (1, "#F6C98E")])
        + lin(f"{p}h1", [(0, "#D9C690"), (1, "#B8B27A")])
        + lin(f"{p}h2", [(0, "#A9C98A"), (1, "#7FB07A")])
        + lin(f"{p}h3", [(0, "#6E9E6E"), (1, "#4F8A6E")])
        + lin(f"{p}h4", [(0, "#4F8A6E"), (1, "#2F5D50")])
        + rad(f"{p}vig", [(0, "#000", 0), (0.72, "#000", 0), (1, "#1E2A4A", 0.3)], r=0.75)
    )
    b = [local_style(css), f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(f'<g opacity=".55">{starfield(51, 18, (10, 10, 590, 250), rmin=0.7, rmax=1.5, sparkle=0.2, groups=("tw2",))}</g>')
    # light source + rays fanning down through the break
    b.append(f'<circle cx="{lx}" cy="{ly}" r="330" fill="url(#{p}src)" class="glow"/>')
    angs = [32, 44, 55, 66, 76, 86, 95, 104, 114, 125, 136, 148]
    b.append(f'<g class="{p}sway">'
             f'<g fill="url(#{p}ray)">{ray_fan(lx, ly, angs, 1000, 4.2, "#FFF6D8", 0.4).replace(" fill=\"#FFF6D8\"", "")}</g>'
             f'{ray_fan(lx, ly, [38, 60, 80, 100, 120, 142], 1000, 1.4, "#FFFFFF", 0.22)}</g>')
    # cloud bank with gold-lit undersides and a gap over the light
    cl = []
    for (cx, cy, s) in [(70, 420, 1.3), (200, 395, 1.05), (420, 390, 1.1), (560, 420, 1.35), (110, 480, 0.9), (500, 485, 0.95)]:
        cl.append(cloud(cx, cy, s, f"url(#{p}cl)"))
    b.append(f'<g class="drift">{"".join(cl[:3])}</g><g>{"".join(cl[3:])}</g>')
    b.append(f'<path d="M150,500 Q300,540 450,500" fill="none" stroke="#FFE9A8" stroke-width="5" stroke-linecap="round" opacity=".7"/>')
    b.append(cloud(300, 300, 0.75, "#F6EEF4", 0.55))
    # Judean hills with a sunlit stone town far away
    b.append(f'<path d="{smooth([(-20, 960), (120, 930), (260, 950), (390, 920), (520, 945), (620, 930)], 1320)}" fill="url(#{p}h1)"/>')
    houses = [(330, 935, 30, 22, "flat"), (356, 928, 26, 30, "dome"), (378, 924, 30, 24, "flat"),
              (404, 928, 26, 34, "tower"), (426, 934, 30, 20, "flat"), (452, 940, 24, 18, "flat")]
    bodies, wins = town(houses, "#F3DDB4", "#D9B98A", "#FFF1D6", "#B9832A", dome_col="#EBD0A0")
    b.append(f'<g opacity=".92">{bodies}{wins}</g>')
    b.append(f'<path d="{smooth([(-20, 1030), (120, 995), (270, 1030), (420, 1000), (620, 1025)], 1320)}" fill="url(#{p}h2)"/>')
    b.append(f'<path d="{smooth([(-20, 1030), (120, 995), (270, 1030), (420, 1000), (620, 1025)])}" fill="none" stroke="#FFF1C4" stroke-width="3" opacity=".7"/>')
    for (x, base, s) in [(80, 1040, 0.5), (500, 1030, 0.55), (545, 1036, 0.4)]:
        b.append(olive_tree(x, base, s, "#6B5236", "#6E9472", "#8FB394", hi="#D6E6C8"))
    b.append(f'<path d="{smooth([(-20, 1110), (150, 1080), (330, 1115), (500, 1088), (620, 1100)], 1320)}" fill="url(#{p}h3)"/>')
    b.append(sheep(400, 1112, 0.34))
    b.append(sheep(470, 1128, 0.28, cls="bob"))
    b.append(sheep(150, 1130, 0.3))
    b.append(f'<path d="{smooth([(-20, 1190), (170, 1165), (340, 1195), (520, 1170), (620, 1180)], 1320)}" fill="url(#{p}h4)"/>')
    b.append(olive_tree(34, 1250, 1.1, "#4A3426", "#4F7A5E", "#6E9472", hi="#BFD8B0"))
    rnd = random.Random(52)
    fl = "".join(f'<circle cx="{rnd.uniform(140, 590):.1f}" cy="{rnd.uniform(1215, 1295):.1f}" r="{rnd.uniform(2.5, 4.5):.1f}" fill="{rnd.choice(["#FFF6E5", "#F8DC8B", "#F28B82"])}"/>' for _ in range(24))
    b.append(f'<g opacity=".9">{fl}</g>')
    # doves rising into the light
    b.append(dove(150, 640, 1.0))
    b.append(dove(455, 610, 0.8, flip=True))
    b.append(dove(520, 760, 0.55, flip=True))
    b.append(dove(90, 800, 0.5))
    sp = "".join(sparkle_star(x, y, r, "#FFF6D8") for x, y in [(60, 280), (540, 230), (250, 720), (380, 840), (70, 900), (540, 880)] for r in [8])
    b.append(f'<g class="tw">{sp}</g>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/victory-good.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ victory evil
def build_victory_evil():
    p = "ve"
    defs = (
        lin(f"{p}sky", [(0, "#0E0A22"), (0.35, "#21163C"), (0.65, "#3A2560"), (1, "#56367A")])
        + rad(f"{p}halo", [(0, "#E4D6F5", 0.5), (0.4, "#B48CE0", 0.18), (1, "#B48CE0", 0)])
        + rad(f"{p}moon", [(0, "#FFF8E6"), (0.7, "#F1E6CA"), (1, "#D6C6E6")], cx=0.42, cy=0.4, r=0.65)
        + lin(f"{p}fog", [(0, "#C9B5E8", 0), (0.3, "#D9C9F0", 0.26), (0.7, "#D9C9F0", 0.26), (1, "#C9B5E8", 0)], 0, 0, 1, 0)
        + rad(f"{p}eye", [(0, "#F8DC8B", 0.85), (1, "#F8DC8B", 0)])
        + lin(f"{p}d1", [(0, "#4A2F6A"), (1, "#3A2550")])
        + lin(f"{p}d2", [(0, "#33204C"), (1, "#24163A")])
        + rad(f"{p}vig", [(0, "#000", 0), (0.62, "#000", 0), (1, "#0A0718", 0.55)], r=0.75)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}sky)"/>']
    b.append(starfield(61, 80, (8, 8, 592, 800), color="#EFE4FB", rmin=0.7, rmax=1.9, sparkle=0.12, groups=("tw", "tw3")))
    mx, my = 300, 320
    b.append(f'<circle cx="{mx}" cy="{my}" r="290" fill="url(#{p}halo)" class="glow"/>')
    b.append(f'<circle cx="{mx}" cy="{my}" r="138" fill="url(#{p}moon)"/>')
    cr = "".join(f'<circle cx="{mx+cx}" cy="{my+cy}" r="{r}"/>' for cx, cy, r in [(-48, -36, 22), (40, 10, 30), (-20, 60, 16), (62, -60, 12), (-74, 30, 10)])
    b.append(f'<g fill="#B48CE0" opacity=".14">{cr}</g>')
    b.append(f'<g class="drift"><rect x="110" y="372" width="240" height="20" rx="10" fill="#7E57A6" opacity=".55"/>'
             f'<rect x="300" y="406" width="200" height="14" rx="7" fill="#7E57A6" opacity=".45"/></g>')
    # distant dark town with a couple of plum-lit windows
    b.append(f'<path d="{smooth([(-20, 975), (130, 955), (280, 975), (430, 950), (620, 970)], 1320)}" fill="#3A2550" opacity=".9"/>')
    houses = [(70, 968, 30, 22, "flat"), (98, 962, 26, 32, "dome"), (122, 958, 30, 24, "flat"), (150, 962, 24, 18, "flat")]
    bodies, wins = town(houses, "#2E1D46", "#26183C", "#3A2550", "#B48CE0", dome_col="#33204C")
    b.append(bodies + f'<g opacity=".8">{wins}</g>')
    # dunes
    b.append(f'<path d="{smooth([(-20, 1060), (140, 1020), (330, 1070), (500, 1035), (620, 1055)], 1320)}" fill="url(#{p}d1)"/>')
    b.append(f'<path d="{smooth([(-20, 1060), (140, 1020), (330, 1070), (500, 1035), (620, 1055)])}" fill="none" stroke="#B48CE0" stroke-width="2.5" opacity=".45"/>')
    b.append(palm(470, 1048, 0.9, "#1F1432"))
    b.append(palm(510, 1052, 0.65, "#1F1432"))

    def peeker(x, y, s, cls):
        g = [f'<g fill="#1F1432"><circle cx="{x-26*s:.1f}" cy="{y:.1f}" r="{26*s:.1f}"/>'
             f'<circle cx="{x:.1f}" cy="{y-14*s:.1f}" r="{32*s:.1f}"/><circle cx="{x+28*s:.1f}" cy="{y:.1f}" r="{24*s:.1f}"/>'
             f'<rect x="{x-52*s:.1f}" y="{y:.1f}" width="{104*s:.1f}" height="{26*s:.1f}"/></g>',
             f'<g class="{cls}"><circle cx="{x:.1f}" cy="{y-12*s:.1f}" r="{22*s:.1f}" fill="url(#{p}eye)" opacity=".35"/>']
        for ex in (-9, 9):
            g.append(f'<ellipse cx="{x+ex*s:.1f}" cy="{y-12*s:.1f}" rx="{5.4*s:.1f}" ry="{4*s:.1f}" fill="#F8DC8B"/>'
                     f'<circle cx="{x+(ex+2)*s:.1f}" cy="{y-11.5*s:.1f}" r="{2.2*s:.1f}" fill="#2A1A40"/>'
                     f'<path d="M{x+(ex-6)*s:.1f},{y-15*s:.1f} Q{x+ex*s:.1f},{y-19*s:.1f} {x+(ex+6)*s:.1f},{y-15*s:.1f}Z" fill="#1F1432"/>')
        g.append('</g>')
        return "".join(g)
    b.append(peeker(92, 1088, 1.1, "tw2"))
    b.append(f'<path d="{smooth([(-20, 1170), (160, 1130), (340, 1180), (500, 1145), (620, 1160)], 1320)}" fill="url(#{p}d2)"/>')
    b.append(peeker(400, 1196, 0.85, "tw3"))
    b.append(f'<path d="{smooth([(-20, 1250), (200, 1225), (420, 1255), (620, 1235)], 1320)}" fill="#160D28"/>')
    # drifting desert mist
    b.append(f'<g class="drift"><rect x="-120" y="740" width="560" height="60" rx="30" fill="url(#{p}fog)"/>'
             f'<rect x="240" y="1110" width="520" height="70" rx="35" fill="url(#{p}fog)"/></g>')
    b.append(f'<g class="drift" style="animation-duration:19s"><rect x="160" y="900" width="560" height="56" rx="28" fill="url(#{p}fog)"/>'
             f'<rect x="-160" y="1020" width="560" height="64" rx="32" fill="url(#{p}fog)"/></g>')

    def mask(x, y, s, rot, cls):
        return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})" opacity=".78"><g class="{cls}">'
                f'<path d="M-34,-6 Q-34,-18 -18,-18 Q-6,-18 0,-10 Q6,-18 18,-18 Q34,-18 34,-6 Q34,12 16,12 Q6,12 0,4 Q-6,12 -16,12 Q-34,12 -34,-6Z" fill="#B48CE0"/>'
                f'<ellipse cx="-15" cy="-4" rx="7" ry="5" fill="#2A1A40"/><ellipse cx="15" cy="-4" rx="7" ry="5" fill="#2A1A40"/>'
                f'<path d="M-30,-10 Q-18,-24 -4,-14" fill="none" stroke="#E4D6F5" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>'
                f'</g></g>')
    b.append(mask(100, 600, 1.0, -12, "bob"))
    b.append(mask(505, 690, 0.8, 14, "bob"))
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/victory-evil.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ reveal
def build_reveal():
    p = "rv"

    def folds(id_, n, c1, c2):
        return lin(id_, [(round(i / n, 3), c1 if i % 2 == 0 else c2) for i in range(n + 1)], 0, 0, 1, 0)
    defs = (
        lin(f"{p}bg", [(0, "#120E26"), (0.5, "#1B1636"), (1, "#0E0B1F")])
        + rad(f"{p}spot", [(0, "#FFF1C9", 0.42), (0.35, "#F8DC8B", 0.15), (0.7, "#B48CE0", 0.05), (1, "#B48CE0", 0)])
        + lin(f"{p}cone", [(0, "#FFF1C9", 0.0), (0.15, "#FFF1C9", 0.1), (1, "#FFF1C9", 0.02)])
        + folds(f"{p}cl", 8, "#5B3A7A", "#3A2550")
        + folds(f"{p}cr", 8, "#3A2550", "#5B3A7A")
        + lin(f"{p}shL", [(0, "#000", 0), (1, "#000", 0.45)], 0, 0, 1, 0)
        + lin(f"{p}shR", [(0, "#000", 0.45), (1, "#000", 0)], 0, 0, 1, 0)
        + lin(f"{p}val", [(0, "#2E1D46"), (1, "#5B3A7A")])
        + lin(f"{p}gold", [(0, "#F8DC8B"), (0.5, "#E9B949"), (1, "#B9832A")])
        + rad(f"{p}floor", [(0, "#F8DC8B", 0.3), (1, "#F8DC8B", 0)])
        + glow_def(f"{p}lamp", "#F8DC8B", 0.7)
        + lin(f"{p}clay", [(0, "#D98B5F"), (1, "#8E4A2C")])
        + rad(f"{p}vig", [(0, "#000", 0), (0.55, "#000", 0), (1, "#05040D", 0.6)], r=0.72)
    )
    b = [f'<rect width="{W}" height="{H}" fill="url(#{p}bg)"/>']
    b.append(f'<path d="M250,0 L350,0 L560,1150 L40,1150Z" fill="url(#{p}cone)"/>')
    b.append(f'<ellipse cx="300" cy="620" rx="330" ry="470" fill="url(#{p}spot)" class="glow"/>')
    b.append(f'<ellipse cx="300" cy="1120" rx="260" ry="50" fill="url(#{p}floor)"/>')
    rnd = random.Random(71)
    groups = {"tw": [], "tw2": [], "tw3": []}
    for i in range(18):
        x, y = rnd.uniform(140, 460), rnd.uniform(200, 1050)
        g = list(groups)[i % 3]
        groups[g].append(sparkle_star(x, y, rnd.uniform(4, 7), "#FFF1C9") if rnd.random() < 0.35
                         else f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(1, 2):.1f}"/>')
    for g, items in groups.items():
        b.append(f'<g fill="#FFF1C9" class="{g}">{"".join(items)}</g>')
    # tabernacle curtains, tied back, with embroidered gold borders on inner edges
    left = "M-10,0 L150,0 C150,220 132,520 92,740 C80,800 96,850 110,900 C128,1000 150,1180 160,1310 L-10,1310Z"
    right = "M610,0 L450,0 C450,220 468,520 508,740 C520,800 504,850 490,900 C472,1000 450,1180 440,1310 L610,1310Z"
    b.append(f'<path d="{left}" fill="url(#{p}cl)"/><path d="{left}" fill="url(#{p}shL)"/>')
    b.append(f'<path d="{right}" fill="url(#{p}cr)"/><path d="{right}" fill="url(#{p}shR)"/>')
    for x0, x1 in [(28, 18), (62, 50)]:
        b.append(f'<path d="M{x0},0 C{x0},300 {x1+10},600 {x1+10},760 C{x1+14},900 {x0+14},1100 {x0+18},1310" fill="none" stroke="#7E57A6" stroke-width="3" opacity=".45"/>')
        b.append(f'<path d="M{600-x0},0 C{600-x0},300 {590-x1},600 {590-x1},760 C{586-x1},900 {586-x0},1100 {582-x0},1310" fill="none" stroke="#7E57A6" stroke-width="3" opacity=".45"/>')
    edgeL = "M138,96 C138,260 124,520 84,740 C72,800 88,850 102,900 C120,1000 142,1180 152,1310"
    edgeR = "M462,96 C462,260 476,520 516,740 C528,800 512,850 498,900 C480,1000 458,1180 448,1310"
    for e in (edgeL, edgeR):
        b.append(f'<path d="{e}" fill="none" stroke="url(#{p}gold)" stroke-width="12"/>'
                 f'<path d="{e}" fill="none" stroke="#5B3A7A" stroke-width="4" stroke-dasharray="6 12"/>'
                 f'<path d="{e}" fill="none" stroke="#FFF1C4" stroke-width="2" stroke-dasharray="1 17" stroke-linecap="round"/>')
    # tie-backs with tassels
    for x, s in [(96, 1), (504, -1)]:
        b.append(f'<path d="M{x-40*s},735 Q{x},760 {x+22*s},752" fill="none" stroke="url(#{p}gold)" stroke-width="9" stroke-linecap="round"/>'
                 f'<circle cx="{x+20*s}" cy="752" r="9" fill="url(#{p}gold)"/>'
                 f'<path d="M{x+14*s},758 L{x+10*s},800 L{x+30*s},800 L{x+26*s},758Z" fill="#E9B949"/>'
                 f'<path d="M{x+14*s},790 h{16*s}" stroke="#B9832A" stroke-width="2"/>')
    # two clay oil lamps on the floor at the curtain feet
    for x in (150, 450):
        b.append(f'<circle cx="{x+18}" cy="1150" r="70" fill="url(#{p}lamp)" class="glow"/>'
                 f'<path d="M{x-26},1176 Q{x-26},1192 {x},1192 Q{x+20},1192 {x+30},1180 L{x+36},1175 Q{x+26},1172 {x+20},1176 Q{x+6},1166 {x-14},1168 Q{x-26},1170 {x-26},1176Z" fill="url(#{p}clay)"/>'
                 f'<ellipse cx="{x-2}" cy="1171" rx="8" ry="3" fill="#4A2A1A"/>'
                 + flame(x + 33, 1174, 0.36))
    # valance with scallops, gold fringe and a row of pomegranate-like bells
    sc = 8
    wv = W / sc
    scal = " ".join(f"Q{600 - (i + 0.5) * wv:.1f},150 {600 - (i + 1) * wv:.1f},96" for i in range(sc))
    b.append(f'<path d="M-10,0 H610 V96 {scal} L-10,96Z" fill="url(#{p}val)"/>')
    b.append(f'<path d="M610,96 {scal}" fill="none" stroke="url(#{p}gold)" stroke-width="5"/>')
    b.append(f'<rect x="-10" y="50" width="620" height="8" fill="url(#{p}gold)"/>'
             f'<rect x="-10" y="64" width="620" height="2" fill="#E9B949" opacity=".7"/>')
    for i in range(sc):
        cx = 600 - (i + 0.5) * wv
        b.append(f'<path d="M{cx:.1f},{126} m-6,0 a6,7 0 1,0 12,0 a6,7 0 1,0 -12,0 M{cx-3:.1f},{119} l3,-4 l3,4z" fill="#F8DC8B"/>')
    b.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')
    write("backgrounds/reveal.svg", svg(W, H, "".join(b), defs, extra_attr=BG_ATTR))


# ============================================================ pattern (stained glass / mosaic)
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


def lamp_item(col, flame_col):
    return (f'<g><path d="M-16,2 Q-16,12 0,12 Q13,12 19,3 L24,-1 Q17,-2 13,1 Q4,-5 -9,-3 Q-16,-1 -16,2Z" fill="{col}"/>'
            f'<path d="M-16,2 Q-24,0 -22,-7 Q-20,-2 -13,-1Z" fill="{col}"/>'
            f'<ellipse cx="-2" cy="-1" rx="5" ry="1.8" fill="#000" opacity=".3"/>'
            f'<path d="M22,-2 C18,-7 19,-12 23,-17 C27,-12 27,-7 22,-2Z" fill="{flame_col}"/></g>')


def sprig_item(col):
    leaves = []
    for (t, side) in [(0.18, 1), (0.36, -1), (0.54, 1), (0.72, -1), (0.92, 0)]:
        x = -18 + 36 * t
        y = 9 - 18 * t
        a = -30 + side * 55 if side else -30
        leaves.append(f'<ellipse cx="{x + side*3:.1f}" cy="{y - 4 + (0 if side else -2):.1f}" rx="7" ry="2.7" transform="rotate({a} {x:.1f} {y:.1f})"/>')
    return (f'<g fill="{col}"><path d="M-19,10 Q0,3 18,-9" fill="none" stroke="{col}" stroke-width="1.6" stroke-linecap="round"/>'
            f'{"".join(leaves)}</g>')


def dove_item(col):
    return (f'<g fill="{col}" transform="scale(.5)">'
            f'<path d="M-30,6 Q-8,-4 10,2 Q22,-2 30,-8 Q26,4 16,8 Q4,16 -14,14 Q-24,12 -30,6Z"/>'
            f'<path d="M-6,2 Q-18,-30 6,-40 Q4,-18 12,0Z" opacity=".92"/>'
            f'<path d="M2,4 Q14,-22 34,-26 Q24,-8 16,6Z" opacity=".8"/>'
            f'<path d="M30,-6 L37,-4 L30,-2Z"/></g>')


def pattern_body(overlay=False):
    g = []
    lead = "#0F1630" if not overlay else "#0F1630"
    op = 1.0 if not overlay else 0.85
    # mosaic cells: centre diamond + corner diamond (made of 4 quarters) + 4 edge triangles via lattice
    cA = "#24345C"  # centre glass (blue)
    cB = "#2A2A55"  # corner glass (indigo-plum)
    g.append(f'<g opacity="{0.55 if not overlay else 0.35}">'
             f'<path d="M80,6 L154,80 L80,154 L6,80Z" fill="{cA}"/>'
             + wrap('<path d="M0,-74 L74,0 L0,74 L-74,0Z"/>', 0, 0, 74).replace("<g transform", f'<g fill="{cB}" transform')
             + '</g>')
    # medallion rings in each diamond
    g.append(f'<circle cx="80" cy="80" r="34" fill="#2E4170" opacity="{0.6 if not overlay else 0.35}"/>')
    g.append(wrap(f'<circle r="34" fill="#3A2F62" opacity="{0.6 if not overlay else 0.35}"/>', 0, 0, 34))
    # lead lines (lattice + medallion rims)
    lat = ('<path d="M0,80 L80,0 L160,80 L80,160Z M80,0 L80,-4 M0,80 L-4,80" fill="none"/>')
    g.append(f'<g stroke="{lead}" stroke-width="3.2" fill="none" opacity="{op}">'
             f'<path d="M0,80 L80,0 L160,80 L80,160Z"/><circle cx="80" cy="80" r="34"/>'
             + wrap('<circle r="34"/>', 0, 0, 36) + '</g>')
    g.append(f'<g stroke="#E9B949" stroke-width=".9" fill="none" opacity=".35">'
             f'<path d="M0,80 L80,0 L160,80 L80,160Z"/><circle cx="80" cy="80" r="30"/>'
             + wrap('<circle r="30"/>', 0, 0, 32) + '</g>')
    _ = lat
    # motifs
    g.append(f'<g opacity=".55">{wrap(dove_item("#FFF6E5"), 80, 84, 22)}</g>')
    g.append(f'<g opacity=".6">{wrap(lamp_item("#E9B949", "#FFD9A0"), 0, 2, 28)}</g>')
    # olive sprigs on the four edge cells (centres of the triangles)
    for (x, y, r) in [(36, 36, -45), (124, 36, 45), (36, 124, 45), (124, 124, -45)]:
        g.append(f'<g opacity=".4" transform="translate({x},{y}) rotate({r})">{sprig_item("#9CC48A")}</g>')
    # gold stars at lattice vertices (edge midpoints) - wrapped
    st = sparkle_star(0, 0, 6, "#F8DC8B")
    g.append(f'<g opacity=".7">{wrap(st, 80, 0, 7)}{wrap(st, 0, 80, 7)}</g>')
    dots = "".join(wrap('<circle r="1.2"/>', x, y, 2) for x, y in [(80, 40), (80, 120), (40, 80), (120, 80)])
    g.append(f'<g fill="#F8DC8B" opacity=".45">{dots}</g>')
    return "".join(g)


def build_patterns():
    write("bg-pattern.svg", svg(T, T, f'<rect width="{T}" height="{T}" fill="{P["navy"]}"/>' + pattern_body(), "", anim=False))
    write("bg-pattern-overlay.svg", svg(T, T, pattern_body(overlay=True), "", anim=False))


# ============================================================ clay seal slot
def seal_path(cx, cy, r, seed, lobes=15, amp=0.035):
    rnd = random.Random(seed)
    pts = []
    n = lobes * 2
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r * (1 + (amp if i % 2 == 0 else -amp * 0.4) + rnd.uniform(-0.012, 0.012))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    pts.append(pts[0])
    pts.insert(0, pts[-2])
    d = smooth(pts)
    return d + "Z"


def seal_defs(p):
    return (lin(f"{p}clay", [(0, "#E39A6A"), (0.5, "#C47448"), (1, "#8E4A2C")], 0, 0, 0.3, 1)
            + rad(f"{p}face", [(0, "#F2C49A"), (0.7, "#E3A677"), (1, "#C98556")], cx=0.45, cy=0.4, r=0.6)
            + lin(f"{p}leaf", [(0, "#FFF1C4"), (0.4, "#E9B949"), (1, "#B9832A")], 0, 0, 1, 1)
            + glow_def(f"{p}halo", "#F8DC8B", 0.7))


def seal_svg(p, cx, cy, r, seed, extra_ring=False, extra_cls=("glow", "tw")):
    o = []
    if extra_ring:
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r+20}" fill="url(#{p}halo)" class="{extra_cls[0]}"/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r+9}" fill="none" stroke="url(#{p}leaf)" stroke-width="3.5"/>'
                 f'<circle cx="{cx}" cy="{cy}" r="{r+9}" fill="none" stroke="#FFF6E5" stroke-width="1.4" stroke-dasharray="1 9" stroke-linecap="round" opacity=".8"/>')
        sp = "".join(sparkle_star(cx + (r + 9) * math.cos(math.radians(a)), cy + (r + 9) * math.sin(math.radians(a)), 7, "#FFF1C4")
                     for a in (-45, 45, 135, 225))
        o.append(f'<g class="{extra_cls[1]}">{sp}</g>')
    o.append(f'<path d="{seal_path(cx, cy + 5, r, seed)}" fill="#4A2A1A" opacity=".3"/>')
    o.append(f'<path d="{seal_path(cx, cy, r, seed)}" fill="url(#{p}clay)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.8:.1f}" fill="#7A3E22" opacity=".55"/>')
    o.append(f'<circle cx="{cx}" cy="{cy+1.5}" r="{r*0.77:.1f}" fill="url(#{p}face)"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.66:.1f}" fill="none" stroke="#A85A36" stroke-width="1.6" stroke-dasharray="2 6" stroke-linecap="round" opacity=".55"/>')
    o.append(f'<path d="M{cx-r*0.66:.1f},{cy-r*0.36:.1f} A{r*0.74:.1f},{r*0.74:.1f} 0 0 1 {cx+r*0.12:.1f},{cy-r*0.73:.1f}" fill="none" stroke="#FFF1DC" stroke-width="{r*0.06:.1f}" stroke-linecap="round" opacity=".55"/>')
    # gold-leaf flecks on the clay rim
    rnd = random.Random(seed + 9)
    fl = "".join(f'<circle cx="{cx + r*0.9*math.cos(a):.1f}" cy="{cy + r*0.9*math.sin(a):.1f}" r="{rnd.uniform(1.2, 2.4):.1f}"/>'
                 for a in [rnd.uniform(0, 6.28) for _ in range(6)])
    o.append(f'<g fill="#F8DC8B" opacity=".8">{fl}</g>')
    return "".join(o)


# ============================================================ quest board (scroll)
def build_quest_board():
    p = "qb"
    Wb, Hb = 1000, 240
    defs = (
        lin(f"{p}par", [(0, "#FFF8EA"), (0.55, "#F6E7C8"), (1, "#E6CE9E")])
        + lin(f"{p}roll", [(0, "#C9A86E"), (0.35, "#F6E7C8"), (0.65, "#E3CC9E"), (1, "#A8844C")], 0, 0, 1, 0)
        + lin(f"{p}rod", [(0, "#5E3B14"), (0.4, "#A06A2C"), (1, "#4A2E10")], 0, 0, 1, 0)
        + lin(f"{p}hl", [(0, "#C9D9A4", 0.55), (1, "#A9C98A", 0.3)])
        + lin(f"{p}hd", [(0, "#A9C98A", 0.45), (1, "#7FB07A", 0.3)])
        + rad(f"{p}sun", [(0, "#FFE9A8", 0.7), (1, "#FFE9A8", 0)])
        + f'<clipPath id="{p}clip"><path d="M44,22 Q500,10 956,22 V218 Q500,230 44,218Z"/></clipPath>'
        + seal_defs(p)
    )
    sheet = "M44,22 Q500,10 956,22 V218 Q500,230 44,218Z"
    b = [f'<path d="M44,30 Q500,18 956,30 V226 Q500,238 44,226Z" fill="#4A2E10" opacity=".25"/>',
         f'<path d="{sheet}" fill="url(#{p}par)"/>']
    sc = [f'<circle cx="880" cy="30" r="130" fill="url(#{p}sun)"/>',
          f'<path d="{smooth([(30, 172), (170, 152), (340, 176), (520, 148), (720, 174), (880, 152), (980, 166)], 240)}" fill="url(#{p}hl)"/>',
          f'<path d="{smooth([(30, 206), (220, 188), (430, 212), (650, 190), (860, 210), (980, 198)], 240)}" fill="url(#{p}hd)"/>']
    for x, base, s in [(215, 170, 0.32), (600, 162, 0.3), (790, 172, 0.28)]:
        sc.append(f'<g opacity=".45">{olive_tree(x, base, s, "#7A5C46", "#7FA07A", "#9CBB92")}</g>')
    sc.append(f'<g opacity=".4" fill="#C9A86E"><rect x="404" y="150" width="14" height="12"/><rect x="420" y="144" width="12" height="18"/>'
              f'<path d="M434,162 v-12 a6,6 0 0 1 12,0 v12z"/></g>')
    pts = [(30, 180)]
    for i, x in enumerate(QUEST_X):
        pts.append((x, QUEST_Y))
        if i < 4:
            pts.append(((x + QUEST_X[i + 1]) / 2, QUEST_Y + (42 if i % 2 == 0 else -42)))
    pts.append((980, 70))
    path = smooth(pts)
    sc.append(f'<path d="{path}" fill="none" stroke="#E3CC9E" stroke-width="24" stroke-linecap="round"/>'
              f'<path d="{path}" fill="none" stroke="#FFF8EA" stroke-width="12" stroke-linecap="round" opacity=".85"/>'
              f'<path d="{path}" fill="none" stroke="#B9832A" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" opacity=".7"/>')
    sp = "".join(sparkle_star(x, y, 6, "#E9B949") for x, y in [(70, 50), (410, 44), (595, 50), (790, 44), (215, 52)])
    sc.append(f'<g class="tw">{sp}</g>')
    b.append(f'<g clip-path="url(#{p}clip)">{"".join(sc)}</g>')
    # gold-leaf border: double rule with dotted inlay and corner rosettes
    b.append(f'<path d="M58,34 Q500,24 942,34 V206 Q500,216 58,206Z" fill="none" stroke="url(#{p}leaf)" stroke-width="4"/>'
             f'<path d="M66,42 Q500,32 934,42 V198 Q500,208 66,198Z" fill="none" stroke="#B9832A" stroke-width="1.4" opacity=".6"/>'
             f'<path d="M58,34 Q500,24 942,34" fill="none" stroke="#FFF6E5" stroke-width="1.4" stroke-dasharray="1 8" stroke-linecap="round" opacity=".9"/>')
    for x, y in [(62, 38), (938, 38), (62, 202), (938, 202)]:
        b.append(f'<g fill="url(#{p}leaf)">{sparkle_star(x, y, 11, "#E9B949")}</g><circle cx="{x}" cy="{y}" r="3" fill="#FFF6E5"/>')
    # rolled ends with wooden rods and knobs
    for x0, side in [(18, 1), (982, -1)]:
        rx = x0 - 4 if side > 0 else x0 - 36
        b.append(f'<rect x="{min(x0, x0 - 40 * -side) if side < 0 else x0:.0f}" y="16" width="40" height="208" rx="18" fill="url(#{p}roll)"/>'
                 if False else "")
    for (rx, rw) in [(14, 40), (946, 40)]:
        b.append(f'<rect x="{rx}" y="14" width="{rw}" height="212" rx="20" fill="url(#{p}roll)"/>'
                 f'<path d="M{rx+8},24 V216" stroke="#FFFBF0" stroke-width="3" opacity=".6" stroke-linecap="round"/>'
                 f'<rect x="{rx+12}" y="4" width="16" height="232" rx="8" fill="url(#{p}rod)"/>'
                 f'<circle cx="{rx+20}" cy="6" r="11" fill="url(#{p}leaf)"/><circle cx="{rx+20}" cy="234" r="11" fill="url(#{p}leaf)"/>'
                 f'<circle cx="{rx+17}" cy="3" r="3.5" fill="#FFF6E5" opacity=".8"/><circle cx="{rx+17}" cy="231" r="3.5" fill="#FFF6E5" opacity=".8"/>')
    for i, x in enumerate(QUEST_X):
        b.append(seal_svg(p, x, QUEST_Y, QUEST_R, seed=100 + i, extra_ring=(i == 3), extra_cls=("glow", "tw2")))
    write("track/quest-board.svg", svg(Wb, Hb, "".join(b), defs))


def build_quest_slot():
    p = "qs"
    write("track/quest-slot.svg", svg(200, 200, seal_svg(p, 100, 97, 84, seed=7), seal_defs(p), anim=False))


# ============================================================ vote track (stone tablet with lamp hollows)
def build_vote_track():
    p = "vt"
    defs = (
        lin(f"{p}stone", [(0, "#D9C9A6"), (0.5, "#BFAA84"), (1, "#8E7A5C")])
        + lin(f"{p}leaf", [(0, "#FFF1C4"), (0.4, "#E9B949"), (1, "#B9832A")], 0, 0, 1, 1)
        + lin(f"{p}rim", [(0, "#EDE0C2"), (1, "#9E8A6C")], 0, 0, 0.3, 1)
        + rad(f"{p}well", [(0, "#4A3426"), (1, "#22160E")], cx=0.5, cy=0.38, r=0.62)
        + lin(f"{p}warn", [(0, "#E4A1B6"), (0.5, "#A8475F"), (1, "#5B2A4A")], 0, 0, 0.3, 1)
        + rad(f"{p}wwell", [(0, "#5A2440"), (1, "#260E1E")], cx=0.5, cy=0.38, r=0.62)
        + glow_def(f"{p}wglow", "#C8553D", 0.5)
    )
    b = [f'<rect x="4" y="14" width="992" height="140" rx="26" fill="#000" opacity=".25"/>',
         f'<rect x="4" y="6" width="992" height="146" rx="26" fill="url(#{p}stone)"/>']
    rnd = random.Random(81)
    speck = "".join(f'<circle cx="{rnd.uniform(20, 980):.1f}" cy="{rnd.uniform(16, 144):.1f}" r="{rnd.uniform(0.8, 2.2):.1f}"/>' for _ in range(60))
    b.append(f'<g fill="#6E5C44" opacity=".25">{speck}</g>')
    b.append(f'<path d="M30,40 l40,-6 l30,10 M900,128 l40,6 l26,-8 M470,138 l30,-6" fill="none" stroke="#7A6648" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>')
    b.append(f'<rect x="14" y="16" width="972" height="126" rx="20" fill="none" stroke="url(#{p}leaf)" stroke-width="3.5"/>'
             f'<rect x="22" y="24" width="956" height="110" rx="14" fill="none" stroke="#FFF6E5" stroke-width="1.2" stroke-dasharray="1 9" stroke-linecap="round" opacity=".8"/>')
    b.append(f'<path d="M{VOTE_X[0]},{VOTE_Y} H{VOTE_X[-1]}" stroke="url(#{p}leaf)" stroke-width="4" stroke-linecap="round" opacity=".85"/>')
    for x in [(VOTE_X[i] + VOTE_X[i + 1]) / 2 for i in range(4)]:
        b.append(f'<g fill="url(#{p}leaf)">{sparkle_star(x, VOTE_Y, 10, "#E9B949")}</g>')
    for i, x in enumerate(VOTE_X):
        last = i == 4
        if last:
            b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R+22}" fill="url(#{p}wglow)" class="glow"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y+4}" r="{VOTE_R}" fill="#000" opacity=".28"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R}" fill="{f"url(#{p}warn)" if last else f"url(#{p}rim)"}"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R-3}" fill="none" stroke="{"#F6C9D6" if last else f"url(#{p}leaf)"}" stroke-width="2.5"/>')
        for k in range(8):
            a = math.radians(22.5 + 45 * k)
            b.append(f'<circle cx="{x + (VOTE_R-9)*math.cos(a):.1f}" cy="{VOTE_Y + (VOTE_R-9)*math.sin(a):.1f}" r="2.4" fill="{"#FFE3EC" if last else "#8E7A5C"}" opacity=".6"/>')
        b.append(f'<circle cx="{x}" cy="{VOTE_Y}" r="{VOTE_R*0.7:.1f}" fill="{f"url(#{p}wwell)" if last else f"url(#{p}well)"}"/>')
        b.append(f'<path d="M{x-VOTE_R*0.55:.1f},{VOTE_Y+VOTE_R*0.35:.1f} A{VOTE_R*0.66:.1f},{VOTE_R*0.66:.1f} 0 0 0 {x+VOTE_R*0.55:.1f},{VOTE_Y+VOTE_R*0.35:.1f}" fill="none" stroke="#000" stroke-width="3" opacity=".25"/>')
        b.append(f'<path d="M{x-VOTE_R*0.62:.1f},{VOTE_Y-VOTE_R*0.42:.1f} A{VOTE_R*0.78:.1f},{VOTE_R*0.78:.1f} 0 0 1 {x+VOTE_R*0.1:.1f},{VOTE_Y-VOTE_R*0.78:.1f}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>')
    write("track/vote-track.svg", svg(1000, 160, "".join(b), defs))


def build_vote_marker():
    p = "vm"
    defs = (glow_def(f"{p}g", "#F8DC8B", 0.85)
            + lin(f"{p}clay", [(0, "#F0B37E"), (0.5, "#D98B5F"), (1, "#8E4A2C")])
            + lin(f"{p}leaf", [(0, "#FFF1C4"), (1, "#B9832A")]))
    lamp = ('M14,70 Q14,90 46,90 Q70,90 82,74 L92,66 Q80,62 72,68 Q56,56 32,58 Q14,60 14,70Z')
    b = [f'<circle cx="62" cy="46" r="46" fill="url(#{p}g)" class="glow"/>',
         f'<ellipse cx="48" cy="92" rx="30" ry="5" fill="#000" opacity=".25"/>',
         f'<path d="{lamp}" fill="url(#{p}clay)"/>',
         f'<path d="M14,70 Q2,66 6,54 Q10,62 20,62Z" fill="url(#{p}clay)"/>',
         f'<ellipse cx="42" cy="64" rx="12" ry="3.6" fill="#4A2A1A"/>',
         f'<path d="M20,78 Q46,86 76,74" fill="none" stroke="url(#{p}leaf)" stroke-width="3" stroke-linecap="round"/>',
         f'<circle cx="34" cy="80" r="1.8" fill="#FFF1C4"/><circle cx="48" cy="82" r="1.8" fill="#FFF1C4"/><circle cx="62" cy="80" r="1.8" fill="#FFF1C4"/>',
         flame(86, 66, 0.72, outer="#F6A04D", mid="#FFD36E", core="#FFF6D8")]
    write("track/vote-marker.svg", svg(100, 100, "".join(b), defs))


def build_two_fails():
    p = "tf"
    defs = (lin(f"{p}clay", [(0, "#9C7AC4"), (0.5, "#6E4A96"), (1, "#3A2550")], 0, 0, 0.3, 1)
            + rad(f"{p}face", [(0, "#8E6CB8"), (1, "#4B2E6B")], cx=0.45, cy=0.4, r=0.6))
    b = [f'<path d="{seal_path(50, 53, 46, 3, lobes=12, amp=0.04)}" fill="#000" opacity=".25"/>',
         f'<path d="{seal_path(50, 50, 46, 3, lobes=12, amp=0.04)}" fill="url(#{p}clay)"/>',
         f'<circle cx="50" cy="50" r="37" fill="url(#{p}face)"/>',
         f'<circle cx="50" cy="50" r="37" fill="none" stroke="#E4D6F5" stroke-width="1.4" stroke-dasharray="1 6" stroke-linecap="round" opacity=".6"/>']
    for cx in (32, 68):
        b.append(cloud(cx, 45, 0.17, "#C9C0DC"))
        b.append(f'<circle cx="{cx-5}" cy="41" r="4.5" fill="#EFE8F8" opacity=".6"/>')
        b.append(f'<path d="M{cx+1},52 l-4,7 h4 l-3,7 l8,-10 h-4 l3,-4z" fill="#F8DC8B"/>')
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
