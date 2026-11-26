"""Build card back, tokens, vote cards, team emblems and knowledge marks.

Run from this directory:  python3 build_tokens.py
Writes into the assets dir (parent of _src).
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ASSETS = os.path.dirname(HERE)

from lib import P, svg, lin, rad, glow_def, stars, sparkle_star, rays, dove, flame  # noqa: E402


def write(rel, text):
    path = os.path.join(ASSETS, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"{rel:32s} {len(text.encode()):6d} B")


# ------------------------------------------------------------ helpers
def clay_lamp(x, y, s, p, flame_cls="fl"):
    """Biblical clay oil lamp, side view. (x, y) = centre of the body.
    Returns (defs, body). Flame sits on the nozzle tip."""
    defs = (lin(f"{p}lb", [(0, "#F0A35E"), (0.55, "#C9733A"), (1, "#8E4A22")])
            + lin(f"{p}lt", [(0, "#F7BE85"), (1, "#D98A4A")]))
    t = f"translate({x},{y}) scale({s})"
    body = (
        f'<g transform="{t}">'
        # handle loop (back)
        f'<path d="M-44,-6 C-66,-14 -70,14 -46,12" fill="none" stroke="#9A5228" stroke-width="8" stroke-linecap="round"/>'
        # foot
        f'<ellipse cx="0" cy="22" rx="26" ry="6" fill="#7A3E1C"/>'
        # body with nozzle
        f'<path d="M-50,0 C-50,-20 -22,-26 0,-25 C22,-24 38,-18 50,-12 L68,-17 C79,-20 83,-8 75,-4 L52,7 '
        f'C42,18 22,23 0,23 C-30,23 -50,15 -50,0Z" fill="url(#{p}lb)"/>'
        # top face
        f'<path d="M-42,-8 C-38,-20 -16,-24 2,-23 C20,-22 34,-17 44,-12 C30,-8 14,-6 0,-6 C-16,-6 -32,-6 -42,-8Z" fill="url(#{p}lt)"/>'
        # filling hole + nozzle hole
        f'<ellipse cx="-6" cy="-14" rx="10" ry="3.6" fill="#6B3418"/>'
        f'<ellipse cx="72" cy="-13" rx="4" ry="2" fill="#5A2A12"/>'
        # decorative dot band
        + "".join(f'<circle cx="{dx}" cy="{4 + abs(dx) * 0.05:.1f}" r="2.4" fill="#F7C99A" opacity=".85"/>'
                  for dx in range(-36, 41, 12))
        + f'<path d="M-40,-2 C-36,-12 -22,-16 -10,-17" fill="none" stroke="#FFE2BE" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
        f'</g>'
    )
    fx, fy = x + 72 * s, y - 14 * s
    return defs, body, (fx, fy)


def beads(cx, cy, r, n, rr, color, op=1, rot=0):
    return "".join(
        f'<circle cx="{cx + r * math.cos(math.radians(rot + i * 360 / n)):.1f}" '
        f'cy="{cy + r * math.sin(math.radians(rot + i * 360 / n)):.1f}" r="{rr}" fill="{color}" opacity="{op}"/>'
        for i in range(n))


def olive_sprig(x, y, s, rot=0):
    leaves = [(8, 2, -30), (16, -3, 25), (24, 4, -20), (32, -1, 30), (40, 3, -10)]
    lv = "".join(
        f'<ellipse cx="{lx}" cy="{ly}" rx="7.5" ry="3.2" transform="rotate({a} {lx} {ly})" '
        f'fill="{P["meadow"] if i % 2 else "#5E9A5A"}"/>' for i, (lx, ly, a) in enumerate(leaves))
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            f'<path d="M0,0 Q20,4 44,2" fill="none" stroke="#5E7A3A" stroke-width="2.2" stroke-linecap="round"/>'
            f'{lv}<circle cx="20" cy="7" r="3" fill="#4E6B2E"/><circle cx="36" cy="7" r="2.6" fill="#4E6B2E"/></g>')


def silhouette(fill, cx=100):
    return (f'<circle cx="{cx}" cy="76" r="31" fill="{fill}"/>'
            f'<path d="M{cx-66},196 C{cx-66},140 {cx-38},116 {cx},116 C{cx+38},116 {cx+66},140 {cx+66},196Z" fill="{fill}"/>')


def crescent(cx, cy, r, color, cut=0.78, off=0.42):
    """Crescent opening to the right, centred on (cx, cy)."""
    r2 = r * cut
    ox = r * off
    # outer arc then inner arc
    y1 = cy - r * 0.92
    y2 = cy + r * 0.92
    return (f'<path d="M{cx + r*0.38:.1f},{y1:.1f} A{r},{r} 0 1,0 {cx + r*0.38:.1f},{y2:.1f} '
            f'A{r2:.1f},{r2:.1f} 0 1,1 {cx + r*0.38:.1f},{y1:.1f}Z" fill="{color}"/>')


def mask(x, y, s, fill, edge, eye="#2A1A3C"):
    return (f'<g transform="translate({x},{y}) scale({s})">'
            f'<path d="M-42,-6 C-46,-14 -52,-14 -54,-8" fill="none" stroke="{edge}" stroke-width="3" stroke-linecap="round"/>'
            f'<path d="M42,-6 C46,-14 52,-14 54,-8" fill="none" stroke="{edge}" stroke-width="3" stroke-linecap="round"/>'
            f'<path d="M-42,-6 C-32,-22 -10,-18 0,-8 C10,-18 32,-22 42,-6 C44,10 30,20 16,17 C7,15 4,8 0,8 '
            f'C-4,8 -7,15 -16,17 C-30,20 -44,10 -42,-6Z" fill="{fill}" stroke="{edge}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-30,-2 C-24,-10 -12,-8 -9,-1 C-14,4 -26,5 -30,-2Z" fill="{eye}"/>'
            f'<path d="M30,-2 C24,-10 12,-8 9,-1 C14,4 26,5 30,-2Z" fill="{eye}"/>'
            f'{sparkle_star(0, -20, 6, edge)}</g>')


# ------------------------------------------------------------ card back
def card_back():
    p = "cb_"
    defs = (rad(f"{p}bg", [(0, "#2C3E6B"), (0.6, "#1E2A4A"), (1, "#141B33")], 0.5, 0.48, 0.7)
            + lin(f"{p}gd", [(0, "#FBE3A0"), (0.5, "#E2A945"), (1, "#A86E22")], 0, 0, 1, 1)
            + rad(f"{p}em", [(0, "#FFD9A0", 0.9), (0.35, "#F4A259", 0.5), (0.7, "#3C5A8A", 0.35), (1, "#1E2A4A", 0)], 0.5, 0.7, 0.62)
            + glow_def(f"{p}fg", "#FFE6A8", 0.95)
            + f'<clipPath id="{p}in"><rect x="26" y="26" width="548" height="788" rx="24"/></clipPath>'
            + f'<clipPath id="{p}ec"><circle cx="300" cy="420" r="168"/></clipPath>')
    G = P["gold"]
    # diamond lattice + dots as a tiny tile pattern
    defs += (f'<pattern id="{p}pt" x="300" y="420" width="46" height="46" patternUnits="userSpaceOnUse">'
             f'<path d="M0,0 L46,46 M46,0 L0,46" stroke="{G}" stroke-width="1.2" opacity=".11"/>'
             f'<circle cx="23" cy="0" r="1.6" fill="{G}" opacity=".2"/><circle cx="0" cy="23" r="1.6" fill="{G}" opacity=".2"/>'
             f'<circle cx="46" cy="23" r="1.6" fill="{G}" opacity=".2"/><circle cx="23" cy="46" r="1.6" fill="{G}" opacity=".2"/>'
             f'<circle cx="23" cy="23" r="2.4" fill="{G}" opacity=".16"/></pattern>')
    lattice = f'<rect x="16" y="16" width="568" height="808" fill="url(#{p}pt)"/>'
    dots = ""
    # rosette rings around the emblem
    petals = []
    for i in range(24):
        a = i * 15
        petals.append(f'<ellipse cx="300" cy="{420 - 200}" rx="9" ry="22" transform="rotate({a} 300 420)"/>')
    rosette = (f'<g fill="none" stroke="{G}" stroke-width="2" opacity=".35">{"".join(petals)}</g>'
               f'<circle cx="300" cy="420" r="228" fill="none" stroke="{G}" stroke-width="1.5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".6"/>')

    def corner():
        return (f'<path d="M44,120 C44,74 74,44 120,44" fill="none" stroke="{G}" stroke-width="3" stroke-linecap="round"/>'
                f'<path d="M58,104 C60,80 80,60 104,58" fill="none" stroke="{G}" stroke-width="2" stroke-linecap="round" opacity=".7"/>'
                f'<path d="M120,44 c10,0 14,10 6,14 c-6,3 -10,-4 -5,-6" fill="none" stroke="{G}" stroke-width="2.5" stroke-linecap="round"/>'
                f'<path d="M44,120 c0,10 10,14 14,6 c3,-6 -4,-10 -6,-5" fill="none" stroke="{G}" stroke-width="2.5" stroke-linecap="round"/>'
                f'<path d="M60,48 l10,10 l-10,10 l-10,-10z" fill="{P["gold_l"]}" transform="translate(-6,-6)"/>')
    c = corner()
    corners = (f'<g>{c}</g><g transform="translate(600,0) scale(-1,1)">{c}</g>'
               f'<g transform="translate(0,840) scale(1,-1)">{c}</g><g transform="translate(600,840) scale(-1,-1)">{c}</g>')
    mids = "".join(f'<path d="M{x},{y - 11} l11,11 l-11,11 l-11,-11z" fill="{P["gold_l"]}" stroke="#8A5A1C" stroke-width="2"/>'
                   for x, y in [(300, 20), (300, 820), (20, 420), (580, 420)])

    # emblem
    ld, lb, (fx, fy) = clay_lamp(278, 494, 1.5, p)
    emblem_inside = (
        f'<rect x="120" y="240" width="360" height="360" fill="#16213D"/>'
        f'<circle cx="300" cy="420" r="168" fill="url(#{p}em)"/>'
        f'{stars(7, 26, 140, 260, 460, 430, color="#FFF1C9", rmin=1, rmax=2.4)}'
        f'{rays(300, 470, 20, 60, 240, 3.5, "#FFE6A8", 0.2, rot=-90)}'
        f'<circle cx="300" cy="460" r="120" fill="url(#{p}fg)" class="glow"/>'
        f'<circle cx="{fx}" cy="{fy - 26}" r="44" fill="url(#{p}fg)"/>'
        f'<path d="M120,520 C180,470 240,490 300,510 C370,470 430,480 480,500 L480,600 L120,600Z" fill="#2F5D50"/>'
        f'<path d="M120,560 C200,520 260,540 320,556 C380,530 440,540 480,552 L480,600 L120,600Z" fill="#234A40"/>'
        f'<path d="M190,512 q6,-14 12,0 M400,498 q5,-12 10,0" stroke="#7FB07A" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>'
        f'{lb}{flame(fx, fy, 1.05)}'
        f'{dove(300, 332, 1.25, "#FFFFFF")}'
    )
    emblem = (
        f'<circle cx="300" cy="420" r="186" fill="#141B33" stroke="{G}" stroke-width="4"/>'
        f'<circle cx="300" cy="420" r="176" fill="none" stroke="{P["gold_l"]}" stroke-width="2" opacity=".7"/>'
        f'{beads(300, 420, 181, 48, 1.8, P["gold_l"], .9)}'
        f'<g clip-path="url(#{p}ec)">{emblem_inside}</g>'
        f'<circle cx="300" cy="420" r="168" fill="none" stroke="{G}" stroke-width="3"/>'
    )
    deco = (f'{sparkle_star(300, 150, 16, P["gold_l"], "tw")}'
            f'<path d="M232,150 H272 M328,150 H368 M300,700 V700" stroke="{G}" stroke-width="2" stroke-linecap="round" opacity=".8"/>'
            f'{sparkle_star(300, 690, 16, P["gold_l"], "tw2")}'
            f'<path d="M232,690 H272 M328,690 H368" stroke="{G}" stroke-width="2" stroke-linecap="round" opacity=".8"/>'
            + "".join(f'<circle cx="{x}" cy="{y}" r="3" fill="{G}"/>' for x, y in [(224, 150), (376, 150), (224, 690), (376, 690)]))
    body = (
        f'<rect width="600" height="840" rx="36" fill="url(#{p}gd)"/>'
        f'<rect x="12" y="12" width="576" height="816" rx="28" fill="#8A5A1C"/>'
        f'<rect x="16" y="16" width="568" height="808" rx="26" fill="url(#{p}bg)"/>'
        f'<g clip-path="url(#{p}in)">{lattice}{dots}</g>'
        f'<rect x="26" y="26" width="548" height="788" rx="22" fill="none" stroke="{G}" stroke-width="2.5"/>'
        f'<rect x="34" y="34" width="532" height="772" rx="18" fill="none" stroke="{G}" stroke-width="1" opacity=".6"/>'
        f'{corners}{mids}{rosette}{deco}{emblem}'
    )
    return svg(600, 840, body, defs + ld, anim=True)


# ------------------------------------------------------------ tokens
def token_success():
    p = "ts_"
    defs = (lin(f"{p}rim", [(0, "#FBE3A0"), (0.5, "#E2A945"), (1, "#A86E22")], 0, 0, 1, 1)
            + rad(f"{p}fd", [(0, "#FFF8E2"), (0.55, "#F8DC8B"), (1, "#E9B949")], 0.5, 0.45, 0.6))
    body = (
        f'<circle cx="100" cy="100" r="97" fill="#8A5A1C"/>'
        f'<circle cx="100" cy="100" r="93" fill="url(#{p}rim)"/>'
        f'{beads(100, 100, 85, 36, 2.2, "#FFF4D2", .9)}'
        f'<circle cx="100" cy="100" r="77" fill="#B9832A"/>'
        f'<circle cx="100" cy="100" r="74" fill="url(#{p}fd)"/>'
        f'{rays(100, 100, 16, 22, 74, 6, "#FFFFFF", 0.55)}'
        f'{rays(100, 100, 16, 22, 60, 4, "#E2A945", 0.45, rot=11.25)}'
        f'<circle cx="100" cy="100" r="34" fill="#FFFDF4" opacity=".75"/>'
        f'<g transform="translate(-4,6)">'
        f'<g transform="translate(96,100) scale(1.55)">'
        f'<path d="M-30,6 Q-8,-4 10,2 Q22,-2 30,-8 Q26,4 16,8 Q4,16 -14,14 Q-24,12 -30,6Z" fill="#FFFFFF" stroke="#C9973E" stroke-width="1.4"/>'
        f'<path d="M-6,2 Q-18,-30 6,-40 Q4,-18 12,0Z" fill="#FFFFFF" stroke="#C9973E" stroke-width="1.4"/>'
        f'<path d="M2,4 Q14,-22 34,-26 Q24,-8 16,6Z" fill="#F4F0E6" stroke="#C9973E" stroke-width="1.4"/>'
        f'<circle cx="24" cy="-4" r="1.9" fill="#4A3426"/>'
        f'<path d="M30,-6 L37,-4 L30,-2Z" fill="#F4A259"/>'
        f'</g>'
        f'{olive_sprig(152, 94, 0.95, 30)}'
        f'</g>'
    )
    return svg(200, 200, body, defs, anim=False)


def token_fail():
    p = "tf_"
    defs = (lin(f"{p}rim", [(0, "#9C78C4"), (0.5, "#6A4590"), (1, "#3A2550")], 0, 0, 1, 1)
            + rad(f"{p}fd", [(0, "#6E4C96"), (1, "#3A2550")], 0.5, 0.4, 0.65)
            + lin(f"{p}cl", [(0, "#D3D9E6"), (0.6, "#A8B3C9"), (1, "#7D879E")]))
    # curling thorn vine on the rim band
    pts = []
    for i in range(0, 361, 4):
        a = math.radians(i)
        r = 84 + 3.2 * math.sin(math.radians(i * 10))
        pts.append(f"{100 + r * math.cos(a):.1f},{100 + r * math.sin(a):.1f}")
    vine = f'<path d="M{" L".join(pts)}Z" fill="none" stroke="#2A1A3C" stroke-width="2.6"/>'
    thorns, curls = [], []
    for i in range(12):
        a = math.radians(i * 30 + 9)
        bx, by = 100 + 86 * math.cos(a), 100 + 86 * math.sin(a)
        tx, ty = 100 + 93 * math.cos(a + 0.06), 100 + 93 * math.sin(a + 0.06)
        n1x, n1y = 100 + 85 * math.cos(a - 0.06), 100 + 85 * math.sin(a - 0.06)
        n2x, n2y = 100 + 85 * math.cos(a + 0.06), 100 + 85 * math.sin(a + 0.06)
        thorns.append(f"M{n1x:.1f},{n1y:.1f} L{tx:.1f},{ty:.1f} L{n2x:.1f},{n2y:.1f}Z")
        a2 = math.radians(i * 30 + 24)
        cx, cy = 100 + 80 * math.cos(a2), 100 + 80 * math.sin(a2)
        curls.append(f'<path d="M{cx:.1f},{cy:.1f} m-3,0 a3,3 0 1,1 3,3" fill="none" stroke="#2A1A3C" stroke-width="1.8" stroke-linecap="round"/>')
    thorn_svg = f'<path d="{" ".join(thorns)}" fill="#2A1A3C"/>'
    sun = (f'{rays(126, 72, 10, 22, 34, 10, "#F8DC8B", 0.75)}'
           f'<circle cx="126" cy="72" r="20" fill="#E9B949"/><circle cx="122" cy="68" r="11" fill="#F8DC8B"/>')
    cloud_parts = [(74, 104, 22), (98, 90, 28), (124, 100, 23), (144, 112, 14), (56, 114, 14)]
    cloud = (f'<g fill="#5A4A78" opacity=".5" transform="translate(2,5)">'
             + "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in cloud_parts)
             + '<rect x="50" y="104" width="104" height="24" rx="12"/></g>'
             + f'<g fill="url(#{p}cl)">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in cloud_parts)
             + '<rect x="50" y="104" width="104" height="24" rx="12"/></g>'
             + '<path d="M80,86 Q90,72 104,74" fill="none" stroke="#F4F6FA" stroke-width="4" stroke-linecap="round" opacity=".8"/>'
             # grumpy little brows + eyes (mischievous, not scary)
             + '<path d="M84,104 l10,3 M118,104 l-10,3" stroke="#4A4560" stroke-width="2.6" stroke-linecap="round"/>'
             + '<circle cx="90" cy="112" r="2.6" fill="#4A4560"/><circle cx="112" cy="112" r="2.6" fill="#4A4560"/>'
             + '<path d="M95,121 Q101,117 107,121" fill="none" stroke="#4A4560" stroke-width="2.4" stroke-linecap="round"/>')
    drops = "".join(f'<path d="M{x},{y} c-3,5 -4,8 0,9 c4,-1 3,-4 0,-9z" fill="#A8C9EE"/>'
                    for x, y in [(72, 136), (92, 144), (112, 136), (132, 144), (82, 156), (122, 156)])
    body = (
        f'<circle cx="100" cy="100" r="97" fill="#26173A"/>'
        f'<circle cx="100" cy="100" r="93" fill="url(#{p}rim)"/>'
        f'{vine}{thorn_svg}{"".join(curls)}'
        f'<circle cx="100" cy="100" r="75" fill="#2A1A3C"/>'
        f'<circle cx="100" cy="100" r="72" fill="url(#{p}fd)"/>'
        f'{sparkle_star(54, 66, 5, "#E4D6F5")}{sparkle_star(150, 140, 4, "#E4D6F5")}'
        f'{sun}{cloud}{drops}'
    )
    return svg(200, 200, body, defs, anim=False)


def vote(kind):
    if kind == "approve":
        p, c1, c2, c3 = "va_", "#58B883", "#3F9D6B", "#2C7550"
    else:
        p, c1, c2, c3 = "vr_", "#DD7258", "#C8553D", "#93392A"
    defs = lin(f"{p}bg", [(0, c1), (0.55, c2), (1, c3)], 0, 0, 0.6, 1)
    cream = P["cream"]
    if kind == "approve":
        mark = (
            f'<path d="M50,104 L84,138 L142,66" fill="none" stroke="{c3}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,4)" opacity=".6"/>'
            f'<path d="M50,104 L84,138 L142,66" fill="none" stroke="{cream}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>'
            # leaf sprouting from the check's tail
            f'<path d="M142,66 C146,48 158,36 176,32 C176,52 164,64 142,66Z" fill="{cream}"/>'
            f'<path d="M144,63 Q156,50 170,38" fill="none" stroke="{c2}" stroke-width="2.4" stroke-linecap="round"/>'
            f'<path d="M140,66 C126,58 118,46 120,34 C134,38 142,50 140,66Z" fill="#DCF0D6"/>'
        )
    else:
        mark = (
            f'<path d="M62,62 L138,138 M138,62 L62,138" stroke="{c3}" stroke-width="30" stroke-linecap="round" transform="translate(0,4)" opacity=".6"/>'
            f'<path d="M62,62 L138,138 M138,62 L62,138" stroke="{cream}" stroke-width="28" stroke-linecap="round"/>'
        )
    body = (
        f'<rect x="6" y="6" width="188" height="188" rx="40" fill="{c3}"/>'
        f'<rect x="10" y="8" width="180" height="180" rx="36" fill="url(#{p}bg)"/>'
        f'<rect x="20" y="18" width="160" height="160" rx="28" fill="none" stroke="{cream}" stroke-width="2.5" opacity=".45"/>'
        f'<path d="M30,40 Q34,26 50,24" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".35"/>'
        f'{mark}'
    )
    return svg(200, 200, body, defs, anim=False)


def leader():
    p = "ld_"
    defs = (lin(f"{p}rim", [(0, "#FBE3A0"), (0.5, "#E2A945"), (1, "#A86E22")], 0, 0, 1, 1)
            + lin(f"{p}fd", [(0, "#FFF3CF"), (1, "#F2C766")]))
    defs += ('<clipPath id="ld_ic"><path d="M100,24 C120,34 142,38 162,38 C162,102 142,144 100,174 '
             'C58,144 38,102 38,38 C58,38 80,34 100,24Z"/></clipPath>')
    shield = "M100,10 C124,22 150,26 176,26 C178,104 152,156 100,190 C48,156 22,104 24,26 C50,26 76,22 100,10Z"
    inner = "M100,24 C120,34 142,38 162,38 C162,102 142,144 100,174 C58,144 38,102 38,38 C58,38 80,34 100,24Z"
    crook = "M96,160 L96,80 C96,52 136,48 138,74 C140,92 120,96 114,84"
    body = (
        f'<path d="{shield}" fill="#8A5A1C"/>'
        f'<path d="{shield}" fill="url(#{p}rim)" transform="translate(100,100) scale(.965) translate(-100,-100)"/>'
        f'<path d="{inner}" fill="#B9832A"/>'
        f'<path d="{inner}" fill="url(#{p}fd)" transform="translate(100,101) scale(.95) translate(-100,-101)"/>'
        f'<g clip-path="url(#ld_ic)">{rays(96, 100, 12, 30, 90, 5, "#FFFFFF", 0.45)}</g>'
        f'<path d="{crook}" fill="none" stroke="#7A4D16" stroke-width="15" stroke-linecap="round" transform="translate(2,3)" opacity=".45"/>'
        f'<path d="{crook}" fill="none" stroke="#8E5A2A" stroke-width="13" stroke-linecap="round"/>'
        f'<path d="{crook}" fill="none" stroke="#C88A4E" stroke-width="5" stroke-linecap="round" transform="translate(-2,-1)"/>'
        f'<path d="M88,124 h17" stroke="#E9B949" stroke-width="5" stroke-linecap="round"/>'
        f'{sparkle_star(62, 66, 15, "#FFFFFF")}{sparkle_star(62, 66, 9, "#E9B949")}'
        f'{sparkle_star(144, 128, 6, "#FFFFFF")}'
    )
    return svg(200, 200, body, defs, anim=False)


def lady():
    p = "ly_"
    ld, lb, (fx, fy) = clay_lamp(92, 128, 0.95, p)
    defs = (rad(f"{p}bg", [(0, "#2E6B78"), (0.6, "#1E4256"), (1, "#141B33")], 0.5, 0.45, 0.6)
            + lin(f"{p}rim", [(0, "#FBE3A0"), (0.5, "#E2A945"), (1, "#A86E22")], 0, 0, 1, 1)
            + glow_def(f"{p}gw", "#FFD98A", 0.95) + ld
            + f'<clipPath id="{p}c"><circle cx="100" cy="100" r="80"/></clipPath>')
    body = (
        f'<circle cx="100" cy="100" r="97" fill="#8A5A1C"/>'
        f'<circle cx="100" cy="100" r="93" fill="url(#{p}rim)"/>'
        f'{beads(100, 100, 86.5, 32, 1.8, "#FFF4D2", .85)}'
        f'<circle cx="100" cy="100" r="80" fill="url(#{p}bg)"/>'
        f'<g clip-path="url(#{p}c)">'
        f'{stars(11, 14, 30, 30, 170, 100, color="#FFF1C9", rmin=0.9, rmax=2)}'
        f'<circle cx="{fx}" cy="{fy - 22}" r="70" fill="url(#{p}gw)" class="glow"/>'
        f'<ellipse cx="100" cy="160" rx="80" ry="22" fill="#163645"/>'
        f'{lb}{flame(fx, fy, 0.62)}'
        f'</g>'
    )
    return svg(200, 200, body, defs, anim=True)


def team_good():
    p = "tg_"
    defs = (rad(f"{p}d", [(0, "#FFF8E2"), (0.5, "#F8DC8B"), (1, "#E2A945")], 0.45, 0.4, 0.6)
            + glow_def(f"{p}h", "#FFE6A8", 0.7))
    body = (
        f'<circle cx="100" cy="100" r="98" fill="url(#{p}h)"/>'
        f'{rays(100, 100, 12, 50, 96, 8, "#E9B949", 1)}'
        f'{rays(100, 100, 12, 50, 80, 5, "#FFF6E5", 1, rot=15)}'
        f'<circle cx="100" cy="100" r="54" fill="#B9832A"/>'
        f'<circle cx="100" cy="100" r="49" fill="url(#{p}d)"/>'
        f'<circle cx="100" cy="100" r="40" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".7"/>'
        f'{flame(100, 128, 0.82, outer="#E2A945", mid="#F4A259", core="#FFF6E5", cls="")}'
        f'<path d="M80,130 Q100,138 120,130" fill="none" stroke="#B9832A" stroke-width="4" stroke-linecap="round"/>'
    )
    return svg(200, 200, body, defs, anim=False)


def team_evil():
    p = "te_"
    defs = (rad(f"{p}d", [(0, "#7E57A6"), (0.7, "#5B3A7A"), (1, "#3A2550")], 0.4, 0.35, 0.7)
            + lin(f"{p}m", [(0, "#F3E9FB"), (1, "#B48CE0")]))
    body = (
        f'<circle cx="100" cy="100" r="94" fill="#26173A"/>'
        f'<circle cx="100" cy="100" r="90" fill="url(#{p}d)"/>'
        f'<circle cx="100" cy="100" r="82" fill="none" stroke="#B48CE0" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>'
        f'{crescent(88, 86, 52, "url(#" + p + "m)")}'
        f'{sparkle_star(140, 54, 9, "#E4D6F5")}{sparkle_star(158, 84, 5, "#E4D6F5")}'
        f'<circle cx="52" cy="142" r="2.5" fill="#E4D6F5"/>'
        f'{mask(122, 138, 0.9, "#5B3A7A", "#E4D6F5")}'
    )
    return svg(200, 200, body, defs, anim=False)


# ------------------------------------------------------------ knowledge marks
def badge(p, bg, rim, inner_svg, defs=""):
    d = f'<clipPath id="{p}c"><circle cx="100" cy="100" r="88"/></clipPath>' + defs
    body = (f'<circle cx="100" cy="100" r="96" fill="{rim}"/>'
            f'<circle cx="100" cy="100" r="88" fill="{bg}"/>'
            f'<g clip-path="url(#{p}c)">{inner_svg}</g>')
    return svg(200, 200, body, d, anim=False)


def k_evil():
    p = "ke_"
    inner = (silhouette("#5B3A7A")
             + f'<circle cx="100" cy="150" r="20" fill="#3A2550"/>'
             + crescent(96, 150, 14, "#F3E9C6")
             + sparkle_star(112, 144, 4, "#F3E9C6")
             + f'<path d="M84,70 l9,3 M116,70 l-9,3" stroke="#E4D6F5" stroke-width="3" stroke-linecap="round" opacity=".8"/>')
    return badge(p, "#E4D6F5", "#3A2550", inner)


def k_merlin():
    p = "km_"
    defs = (f'<clipPath id="{p}L"><rect x="0" y="0" width="100" height="200"/></clipPath>'
            f'<clipPath id="{p}R"><rect x="100" y="0" width="100" height="200"/></clipPath>'
            + glow_def(f"{p}g", "#FFE6A8", 0.95))
    ld, lb, (fx, fy) = clay_lamp(92, 160, 0.42, p)
    inner = (f'<rect width="100" height="200" fill="#FFF3D6"/><rect x="100" width="100" height="200" fill="#EFE6FA"/>'
             f'<g clip-path="url(#{p}L)">{silhouette("#E2A945")}</g>'
             f'<g clip-path="url(#{p}R)">{silhouette("#9C78C4")}</g>'
             f'<path d="M100,40 V196" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="5 5" opacity=".9"/>'
             f'<circle cx="{fx}" cy="{fy - 8}" r="26" fill="url(#{p}g)"/>'
             f'{lb}{flame(fx, fy, 0.3, cls="")}')
    spark = (sparkle_star(158, 50, 15, "#FFFFFF") + sparkle_star(158, 50, 10, "#E9B949")
             + sparkle_star(176, 76, 6, "#B48CE0") + f'<circle cx="168" cy="92" r="3" fill="#B48CE0"/>')
    body = (f'<circle cx="100" cy="100" r="96" fill="#7A5C8E"/>'
            f'<path d="M100,4 A96,96 0 0,0 100,196Z" fill="#B9832A"/>'
            f'<circle cx="100" cy="100" r="88" fill="#FFF"/>'
            f'<g clip-path="url(#{p}c)">{inner}</g>{spark}')
    d = f'<clipPath id="{p}c"><circle cx="100" cy="100" r="88"/></clipPath>' + defs + ld
    return svg(200, 200, body, d, anim=False)


def k_unknown():
    p = "ku_"
    inner = silhouette("#8E9BB5") + '<circle cx="100" cy="76" r="31" fill="none"/>'
    return badge(p, "#DDE3EE", "#6F7C96", inner)


def k_target():
    p = "kt_"
    defs = (rad(f"{p}s", [(0, "#B48CE0", 0.0), (0.62, "#B48CE0", 0.08), (0.8, "#B48CE0", 0.35), (1, "#B48CE0", 0)])
            + lin(f"{p}r", [(0, "#E4D6F5"), (0.5, "#B48CE0"), (1, "#7E57A6")], 0, 0, 1, 1))
    glints = "".join(sparkle_star(100 + 88 * math.cos(math.radians(a)), 100 + 88 * math.sin(math.radians(a)), r, "#F3E9FB")
                     for a, r in [(-45, 11), (135, 8)])
    body = (
        f'<circle cx="100" cy="100" r="99" fill="url(#{p}s)"/>'
        f'<circle cx="100" cy="100" r="80" fill="none" stroke="#3A2550" stroke-width="15" opacity=".55"/>'
        f'<circle cx="100" cy="100" r="80" fill="none" stroke="url(#{p}r)" stroke-width="12"/>'
        f'<circle cx="100" cy="100" r="72" fill="none" stroke="#E4D6F5" stroke-width="2" opacity=".85"/>'
        f'<circle cx="100" cy="100" r="88" fill="none" stroke="#7E57A6" stroke-width="2.5"/>'
        f'<path d="M48,66 A60,60 0 0,1 78,40" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".7"/>'
        f'<path d="M44,84 A60,60 0 0,1 46,76" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".6"/>'
        f'{glints}'
    )
    return svg(200, 200, body, defs, anim=False)


def main():
    write("card-back.svg", card_back())
    write("token-success.svg", token_success())
    write("token-fail.svg", token_fail())
    write("vote-approve.svg", vote("approve"))
    write("vote-reject.svg", vote("reject"))
    write("leader.svg", leader())
    write("lady.svg", lady())
    write("team-good.svg", team_good())
    write("team-evil.svg", team_evil())
    write("knowledge/evil.svg", k_evil())
    write("knowledge/merlin-candidate.svg", k_merlin())
    write("knowledge/unknown.svg", k_unknown())
    write("knowledge/target.svg", k_target())


if __name__ == "__main__":
    main()
