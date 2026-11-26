"""UI art for 빛의 원정대: line icons, logo emblem + hand-lettered title, player avatars.

Run from anywhere:  python3 _src/build_ui.py
Writes into the assets dir (parent of _src): icons/, logo*.svg, avatars/.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import P, svg, lin, rad, glow_def, stars, sparkle_star, rays, dove, flame, face_svg  # noqa: E402

OUT = os.path.dirname(HERE)


def write(rel, text):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path


# =================================================================== ICONS
ICON_HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" '
             'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">')


def gear_path(cx=12, cy=12, teeth=8, r_out=9.6, r_in=7.4, hole=3.0):
    pts = []
    step = 2 * math.pi / teeth
    for i in range(teeth):
        a = i * step - math.pi / 2
        for da, r in ((-0.30, r_in), (-0.17, r_out), (0.17, r_out), (0.30, r_in)):
            ang = a + da * step * 1.6
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    d = "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + "Z"
    return f'<path d="{d}"/><circle cx="{cx}" cy="{cy}" r="{hole}"/>'


def star_path(cx=12, cy=12.4, ro=9.6, ri=4.3):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r = ro if i % 2 == 0 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return '<path d="M' + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + 'Z"/>'


def wifi_off():
    cx, cy = 12, 19.4
    out = []
    for r in (14.5, 9.8, 5.2):
        a0, a1 = math.radians(-90 - 48), math.radians(-90 + 48)
        # gap where the arc crosses the slash y = x
        # solve (x-12)^2+(x-19.4)^2=r^2
        A, B, Cc = 2, -2 * (cx + cy), cx * cx + cy * cy - r * r
        disc = B * B - 4 * A * Cc
        if disc <= 0:
            segs = [(a0, a1)]
        else:
            xg = (-B - math.sqrt(disc)) / (2 * A)
            ag = math.atan2(xg - cy, xg - cx)
            gap = 2.3 / r
            segs = [(a0, ag - gap), (ag + gap, a1)]
        for s0, s1 in segs:
            if s1 - s0 < 0.05:
                continue
            x0, y0 = cx + r * math.cos(s0), cy + r * math.sin(s0)
            x1, y1 = cx + r * math.cos(s1), cy + r * math.sin(s1)
            out.append(f'<path d="M{x0:.2f} {y0:.2f}A{r} {r} 0 0 1 {x1:.2f} {y1:.2f}"/>')
    out.append('<path d="M12 19.6h.01"/><path d="M3 3l18 18"/>')
    return "".join(out)


def olive_branch():
    def leaf(bx, by, tx, ty, w=2.3):
        mx, my = (bx + tx) / 2, (by + ty) / 2
        dx, dy = tx - bx, ty - by
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * w, dx / L * w
        return (f'<path d="M{bx:.2f} {by:.2f}Q{mx+nx:.2f} {my+ny:.2f} {tx:.2f} {ty:.2f}'
                f'Q{mx-nx:.2f} {my-ny:.2f} {bx:.2f} {by:.2f}z"/>')
    return ('<path d="M4 21C8.5 17 13 12 17.5 5.5"/>'
            + leaf(8.2, 17.4, 3.6, 12.2) + leaf(10.4, 15.1, 16.6, 16.4)
            + leaf(13.2, 11.6, 9.8, 5.6) + leaf(15.2, 8.8, 20.8, 9.6)
            + leaf(17.5, 5.5, 19.6, 1.8, 1.6))


ICONS = {
    "users": '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/>'
             '<path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.2c2.1.8 3.5 2.9 3.5 5.8"/>',
    "user-plus": '<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 20.5c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5"/>'
                 '<path d="M19 8v6M16 11h6"/>',
    "user-minus": '<circle cx="9.5" cy="8" r="3.8"/><path d="M2.5 20.5c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5"/>'
                  '<path d="M16 11h6"/>',
    "flag": '<path d="M5 21.5V3.5"/><path d="M5 4.5c2.6-1.6 5 1.6 7.5 0s4.8-1.4 6.5 0v9.5c-1.7-1.4-4-1.6-6.5 0s-4.9 1.6-7.5 0"/>',
    "lamp": '<path d="M3.5 13.5h11.2l4.8-2.3c.8-.4 1.5.5.9 1.2-1.9 2.4-5 5.8-10.4 5.8-4 0-6.5-1.9-6.5-4.7z"/>'
            '<path d="M3.6 14.6c-2 0-2.3-3.1-.3-3.4"/><path d="M8 18.4v2.1h5v-2.1"/>'
            '<path d="M19.8 2.6c1.4 1.6 2 2.8 2 3.8a2 2 0 0 1-4 0c0-1 .6-2.2 2-3.8z"/>',
    "check": '<path d="M4.5 12.5l5 5 10-10.5"/>',
    "x": '<path d="M6 6l12 12M18 6 6 18"/>',
    "copy": '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/>'
            '<path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
    "share": '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 11H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H16"/>',
    "settings": gear_path(),
    "volume-on": '<path d="M3.5 9.5h3.6L12 5v14l-4.9-4.5H3.5z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18.4 6.3a8.2 8.2 0 0 1 0 11.4"/>',
    "volume-off": '<path d="M3.5 9.5h3.6L12 5v14l-4.9-4.5H3.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    "eye": '<path d="M2 12s3.6-6.8 10-6.8S22 12 22 12s-3.6 6.8-10 6.8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M10.2 5.4A10 10 0 0 1 12 5.2c6.4 0 10 6.8 10 6.8a17 17 0 0 1-2.7 3.5"/>'
               '<path d="M6.5 6.8C3.7 8.6 2 12 2 12s3.6 6.8 10 6.8c1.8 0 3.4-.5 4.8-1.3"/>'
               '<path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>',
    "exit": '<path d="M10 3.5H6A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h4"/><path d="M15.5 7.5 20 12l-4.5 4.5M20 12H9"/>',
    "info": '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>',
    "refresh": '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20.5 3.5v4.5H16"/>',
    "star": star_path(),
    "shield": '<path d="M12 2.8 19.5 5.6v5.9c0 4.6-3.2 8.3-7.5 9.7-4.3-1.4-7.5-5.1-7.5-9.7V5.6z"/>',
    "scroll": '<path d="M6 3.5h12a2 2 0 0 1 0 4H6a2 2 0 0 1 0-4z"/><path d="M6 16.5h12a2 2 0 0 1 0 4H6a2 2 0 0 1 0-4z"/>'
              '<path d="M6.5 7.5v9M17.5 7.5v9"/><path d="M9.5 10.5h5M9.5 13.5h3"/>',
    "play": '<path d="M7.5 4.6v14.8L19.5 12z"/>',
    "home": '<path d="M3 11.2 12 3.6l9 7.6"/><path d="M5.5 9.4v9.6A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V9.4"/>'
            '<path d="M10 20.5v-5.5h4v5.5"/>',
    "help": '<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.3a2.8 2.8 0 0 1 5.5.8c0 1.9-2.8 2.4-2.8 4.1"/><path d="M12 17.4h.01"/>',
    "wifi-off": wifi_off(),
    "clock": '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.8V12l3.6 2.2"/>',
    "dove": '<path d="M2.5 14.2c3.4.7 6-.5 7.6-2.7 1-1.4 2.1-3.4 3.9-4.3a3 3 0 0 1 4.2 2.2l3.3.8-3.2 1.3c-.4 4.3-3.8 7.4-8.3 7.4H5.6l2.6-2.4C5.6 16.4 3.6 15.6 2.5 14.2z"/>'
            '<path d="M10.6 11.1C10.2 7.6 8.4 4.8 5.2 3.4c-.6 3.3.3 6.4 2.6 8.6"/>',
    "sheep": '<path d="M4.6 9.4a2.4 2.4 0 0 1 3.9-1.7 2.6 2.6 0 0 1 4.4-.3 2.4 2.4 0 0 1 3.2 1.2"/>'
             '<path d="M15.2 15.4a2.4 2.4 0 0 1-3.4 1.2 2.6 2.6 0 0 1-4.3.2 2.4 2.4 0 0 1-3.6-1.8 2.5 2.5 0 0 1 .7-5.6"/>'
             '<ellipse cx="18.6" cy="12.4" rx="2.9" ry="3.6" transform="rotate(-18 18.6 12.4)"/>'
             '<path d="M15.6 10.2l-2-.9"/><path d="M7.6 16.8v3.4M12.8 16.8v3.4"/>',
    "olive-branch": olive_branch(),
}


def build_icons():
    out = []
    for name, body in ICONS.items():
        out.append(write(f"icons/{name}.svg", ICON_HEAD + body + "</svg>\n"))
    return out


# ============================================================ LOGO: EMBLEM
def lamp(p, x, y, s=1.0):
    """Clay oil lamp, side view, spout to the right. Returns (svg, flame_base_xy)."""
    t = f"translate({x},{y}) scale({s})"
    body = (
        f'<g transform="{t}">'
        f'<path d="M-36,-4 C-54,-10 -54,14 -36,8" fill="none" stroke="{P["gold_dd"]}" stroke-width="7" stroke-linecap="round"/>'
        f'<path d="M-36,-4 C-50,-8 -50,11 -36,8" fill="none" stroke="url(#{p}clay)" stroke-width="3.4" stroke-linecap="round"/>'
        f'<ellipse cx="0" cy="20" rx="17" ry="4.5" fill="{P["gold_dd"]}"/>'
        f'<path d="M-38,0 C-38,-14 -16,-20 4,-18 C16,-17 26,-14 34,-10 L47,-13 Q55,-14 53,-7 L43,2 '
        f'C36,13 16,19 -2,19 C-24,19 -38,12 -38,0Z" fill="url(#{p}clay)" stroke="{P["gold_dd"]}" stroke-width="2.4" stroke-linejoin="round"/>'
        f'<path d="M-30,-4 C-26,-12 -12,-15 0,-15" fill="none" stroke="{P["cream"]}" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
        f'<ellipse cx="-6" cy="-15" rx="11" ry="3.2" fill="{P["gold_dd"]}" opacity=".75"/>'
        + "".join(f'<circle cx="{cx_}" cy="{cy_}" r="2" fill="{P["gold_l"]}" opacity=".85"/>'
                  for cx_, cy_ in [(-24, 6), (-14, 9), (-3, 10), (8, 9), (18, 6)])
        + '</g>'
    )
    return body, (x + 50 * s, y - 12 * s)


def emblem_parts(p):
    """Return (defs, body) for the 200x200 emblem (centre 100,100)."""
    defs = (
        rad(f"{p}bg", [(0, P["navy_l"]), (0.7, P["navy"]), (1, P["navy_d"])], 0.5, 0.42, 0.62)
        + lin(f"{p}ring", [(0, P["gold_l"]), (0.5, P["gold"]), (1, P["gold_d"])], 0, 0, 1, 1)
        + glow_def(f"{p}glow", "#FFD36E", 0.85)
        + lin(f"{p}clay", [(0, "#F6C27A"), (0.55, "#E39A4E"), (1, "#B9692E")])
        + lin(f"{p}h1", [(0, P["dusk"]), (1, P["navy_l"])])
        + lin(f"{p}h2", [(0, "#3D6B5E"), (1, P["pine"])])
        + lin(f"{p}h3", [(0, "#2D5548"), (1, "#1F3D35")])
        + f'<clipPath id="{p}cl"><circle cx="100" cy="100" r="88"/></clipPath>'
    )
    lamp_svg, (fx, fy) = lamp(p, 92, 128, 1.0)
    inner = (
        f'<circle cx="100" cy="100" r="88" fill="url(#{p}bg)"/>'
        + stars(7, 16, 22, 22, 178, 100, color="#FFF3CF", rmin=0.9, rmax=2.0, sparkle=0.25)
        + f'<g class="glow"><circle cx="{fx}" cy="{fy-14}" r="74" fill="url(#{p}glow)"/></g>'
        + rays(fx, fy - 16, 14, 22, 70, 5, P["gold_l"], 0.16, rot=-90)
        # rolling hills
        + f'<path d="M0,140 C30,124 58,120 88,130 C118,140 150,118 200,124 V200 H0Z" fill="url(#{p}h1)"/>'
        + f'<path d="M0,154 C34,140 70,142 100,150 C130,158 162,140 200,146 V200 H0Z" fill="url(#{p}h2)"/>'
        + f'<path d="M0,154 C34,140 70,142 100,150 C130,158 162,140 200,146" fill="none" stroke="{P["gold_l"]}" stroke-width="2" opacity=".45"/>'
        + f'<path d="M0,172 C40,160 76,164 104,170 C134,176 166,162 200,166 V200 H0Z" fill="url(#{p}h3)"/>'
        + f'<path d="M0,172 C40,160 76,164 104,170 C134,176 166,162 200,166" fill="none" stroke="{P["gold_l"]}" stroke-width="1.6" opacity=".3"/>'
        + f'<ellipse cx="96" cy="150" rx="40" ry="5" fill="#000" opacity=".22"/>'
        + lamp_svg
        + flame(fx, fy, 0.5)
        + dove(150, 62, 0.42, P["cream"])
    )
    body = (
        f'<circle cx="100" cy="100" r="97" fill="url(#{p}ring)"/>'
        f'<circle cx="100" cy="100" r="92" fill="{P["gold_dd"]}"/>'
        f'<g clip-path="url(#{p}cl)">{inner}</g>'
        f'<circle cx="100" cy="100" r="84" fill="none" stroke="{P["cream"]}" stroke-width="1.6" opacity=".45"/>'
        + "".join(sparkle_star(100 + 94.5 * math.cos(math.radians(a)), 100 + 94.5 * math.sin(math.radians(a)), 4, P["cream"])
                  for a in (-90, 0, 90, 180))
    )
    return defs, body


# ===================================================== LOGO: HANGUL LETTERS
# Each syllable: list of strokes in a 100x100 box (y down). A stroke is a list
# of commands ('M',x,y) ('L',x,y) ('Q',cx,cy,x,y) ('O',cx,cy,rx,ry) for rings.
def O(cx, cy, rx, ry=None):
    return [("O", cx, cy, rx, ry if ry is not None else rx)]


SYL = {
    "빛": [
        [("M", 17, 6), ("Q", 16.4, 22, 17, 39)],                 # ㅂ left
        [("M", 47, 5), ("Q", 47.6, 22, 47, 39)],                 # ㅂ right
        [("M", 17, 22.5), ("L", 47, 22)],                        # ㅂ middle
        [("M", 17, 39), ("Q", 32, 40, 47, 39)],                  # ㅂ bottom
        [("M", 72, 4), ("Q", 73, 26, 72, 48)],                   # ㅣ
        [("M", 43, 52.5), ("L", 54, 55)],                        # ㅊ dot
        [("M", 20, 68), ("Q", 46, 66.5, 74, 68)],                # ㅊ bar
        [("M", 46.5, 69), ("Q", 40, 86, 18, 97)],                # ㅊ left leg
        [("M", 50, 79), ("Q", 60, 91, 77, 97)],                  # ㅊ right leg
    ],
    "의": [
        O(36, 30, 19, 18.5),                                     # ㅇ
        [("M", 8, 71), ("Q", 37, 69, 66, 71)],                   # ㅡ
        [("M", 85, 5), ("Q", 86, 50, 85, 96)],                   # ㅣ
    ],
    "원": [
        O(30, 19.5, 13, 12.5),                                   # ㅇ
        [("M", 5, 45), ("Q", 30, 43.5, 56, 45)],                 # ㅜ bar
        [("M", 31, 46), ("L", 31, 61)],                          # ㅜ stem
        [("M", 58, 29), ("L", 76, 29)],                          # ㅓ stroke
        [("M", 76, 4), ("Q", 77, 35, 76, 66)],                   # ㅓ vertical
        [("M", 15, 71), ("L", 15, 92), ("Q", 48, 93.5, 84, 91.5)],  # ㄴ
    ],
    "정": [
        [("M", 9, 12), ("Q", 27, 11, 45, 12.5)],                 # ㅈ top
        [("M", 28, 13), ("Q", 25, 34, 7, 52)],                   # ㅈ left leg
        [("M", 29.5, 29), ("Q", 37, 44, 49, 51)],                # ㅈ right leg
        [("M", 56, 31), ("L", 74, 31)],                          # ㅓ stroke
        [("M", 74, 4), ("Q", 75, 31, 74, 58)],                   # ㅓ vertical
        O(44, 80, 23, 13),                                       # ㅇ batchim
    ],
    "대": [
        [("M", 43, 13), ("L", 12, 13), ("Q", 11, 48, 12, 84), ("Q", 28, 85, 45, 83)],  # ㄷ
        [("M", 59, 7), ("Q", 60, 50, 59, 93)],                   # ㅐ first vertical
        [("M", 60, 47), ("L", 73, 47)],                          # ㅐ short stroke
        [("M", 87, 3), ("Q", 88, 50, 87, 97)],                   # ㅐ second vertical
    ],
}


def _xf(x, y, ox, oy, k, rot, cx=50, cy=50):
    a = math.radians(rot)
    dx, dy = x - cx, y - cy
    rx = dx * math.cos(a) - dy * math.sin(a) + cx
    ry = dx * math.sin(a) + dy * math.cos(a) + cy
    return ox + rx * k, oy + ry * k


def stroke_d(strokes, ox, oy, k, rot):
    d = []
    f = lambda x, y: "%.1f,%.1f" % _xf(x, y, ox, oy, k, rot)
    for st in strokes:
        for c in st:
            if c[0] == "M":
                d.append("M" + f(c[1], c[2]))
            elif c[0] == "L":
                d.append("L" + f(c[1], c[2]))
            elif c[0] == "Q":
                d.append("Q" + f(c[1], c[2]) + " " + f(c[3], c[4]))
            elif c[0] == "O":
                _, cx, cy, rx, ry = c
                a, b = f(cx - rx, cy), f(cx + rx, cy)
                d.append(f"M{a} A{rx*k:.1f},{ry*k:.1f} {rot:.1f} 1,0 {b} A{rx*k:.1f},{ry*k:.1f} {rot:.1f} 1,0 {a}Z")
    return " ".join(d)


TITLE = [("빛", 0, -2.5), ("의", 0, 2), (" ", 0, 0), ("원", 0, -2), ("정", 0, 2.5), ("대", 0, -1.5)]


def title_d(x0, y0, k, adv=104, space=38):
    parts = []
    x = x0
    bounce = [-3, 3, 0, -3, 3, -2]
    for i, (ch, _, rot) in enumerate(TITLE):
        if ch == " ":
            x += space * k
            continue
        parts.append(stroke_d(SYL[ch], x, y0 + bounce[i] * k, k, rot))
        x += adv * k
    return " ".join(parts), x


def title_layers(p, d, sw, light=False):
    if light:
        shadow, outline, top, hi = P["gold_l"], P["cream"], f"url(#{p}tg)", P["gold_l"]
        defs = lin(f"{p}tg", [(0, P["ink_l"]), (1, P["ink"])])
        hi_op = ".55"
    else:
        shadow, outline, top, hi = P["navy_d"], P["gold_dd"], f"url(#{p}tg)", P["cream"]
        defs = lin(f"{p}tg", [(0, "#FFF0B8"), (0.45, P["gold_l"]), (0.75, P["gold"]), (1, P["gold_d"])])
        hi_op = ".5"
    g = lambda col, w, extra="": (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w:.1f}" '
                                  f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')
    body = (
        g(shadow, sw * 1.75, ' transform="translate(2.5,4)" opacity=".9"')
        + g(outline, sw * 1.5)
        + g(top, sw)
        + g(hi, sw * 0.22, f' transform="translate(-1.2,-1.6)" opacity="{hi_op}"')
    )
    return defs, body


def build_logo():
    out = []
    # ---- mark
    defs, body = emblem_parts("lm-")
    out.append(write("logo-mark.svg", svg(200, 200, body, defs)))

    # ---- full logos
    for name, light in (("logo.svg", False), ("logo-light.svg", True)):
        p = "lgl-" if light else "lg-"
        edefs, ebody = emblem_parts(p + "e-")
        k = 0.98
        width_units = 5 * 104 + 38 - 4
        x0 = (640 - width_units * k) / 2
        d, _ = title_d(x0, 182, k)
        tdefs, tbody = title_layers(p, d, 10.5 * k, light)
        spark_col = P["gold"] if light else P["gold_l"]
        sparks = (f'<g class="tw">{sparkle_star(x0 - 12, 214, 9, spark_col)}</g>'
                  f'<g class="tw2">{sparkle_star(640 - x0 + 14, 206, 7, spark_col)}</g>'
                  f'<g class="tw3">{sparkle_star(640 - x0 + 2, 276, 5, spark_col)}</g>')
        body = (f'<g transform="translate(232,2) scale(0.88)">{ebody}</g>'
                f'{sparks}{tbody}')
        out.append(write(name, svg(640, 300, body, edefs + tdefs)))
    return out


# ================================================================= AVATARS
def hair_cap(cx, hy, s, col):
    S = lambda v: v * s
    return (f'<path d="M{cx-S(43):.1f},{hy+S(4):.1f} C{cx-S(48):.1f},{hy-S(40):.1f} {cx-S(20):.1f},{hy-S(50):.1f} {cx:.1f},{hy-S(48):.1f} '
            f'C{cx+S(26):.1f},{hy-S(50):.1f} {cx+S(50):.1f},{hy-S(38):.1f} {cx+S(43):.1f},{hy+S(4):.1f} '
            f'C{cx+S(36):.1f},{hy-S(16):.1f} {cx+S(20):.1f},{hy-S(22):.1f} {cx+S(6):.1f},{hy-S(20):.1f} '
            f'Q{cx-S(6):.1f},{hy-S(30):.1f} {cx-S(18):.1f},{hy-S(18):.1f} C{cx-S(30):.1f},{hy-S(16):.1f} {cx-S(38):.1f},{hy-S(8):.1f} {cx-S(43):.1f},{hy+S(4):.1f}Z" fill="{col}"/>')


def hair_shine(cx, hy, col="#FFFFFF"):
    return (f'<path d="M{cx-22},{hy-30} Q{cx-12},{hy-38} {cx},{hy-38}" fill="none" stroke="{col}" '
            f'stroke-width="3.2" stroke-linecap="round" opacity=".28"/>')


def avatar(i, a):
    p = f"av{i}-"
    cx, hy = 100, 86
    s = 40 / 42
    hair, skin, hood, hood2 = a["hair"], a["skin"], a["hood"], a["hood2"]
    style = a["style"]
    defs = (rad(f"{p}bg", [(0, a["bg2"]), (1, a["bg"])], 0.5, 0.35, 0.7)
            + f'<clipPath id="{p}cl"><circle cx="100" cy="100" r="91"/></clipPath>')
    back, front = [], []
    # ---- hair / hats behind the head
    if style == "long":
        back.append(f'<path d="M56,80 C50,124 52,150 60,166 L140,166 C148,150 150,124 144,80 Z" fill="{hair}"/>')
    if style == "ponytail":
        back.append(f'<path d="M134,70 C160,74 168,110 152,138 C148,120 140,104 128,96Z" fill="{hair}"/>'
                    f'<circle cx="137" cy="72" r="7" fill="{a["acc"]}"/>')
    if style == "pigtails":
        for sx in (-1, 1):
            back.append(f'<circle cx="{100+sx*50}" cy="104" r="17" fill="{hair}"/>'
                        f'<circle cx="{100+sx*45}" cy="90" r="6" fill="{a["acc"]}"/>')
    if style == "curly":
        for ang in range(150, 395, 22):
            r = math.radians(ang)
            back.append(f'<circle cx="{cx+44*math.cos(r):.1f}" cy="{hy-4+42*math.sin(r):.1f}" r="16" fill="{hair}"/>')
    if style == "bun":
        back.append(f'<circle cx="{cx}" cy="{hy-46}" r="17" fill="{hair}"/>')
    if style == "hood":
        back.append(f'<path d="M48,136 C38,80 58,34 100,32 C142,34 162,80 152,136 Z" fill="{hood}"/>'
                    f'<path d="M58,128 C50,84 68,46 100,45 C132,46 150,84 142,128 Z" fill="#000" opacity=".2"/>')

    # ---- hoodie shoulders, collar, drawstrings
    body = (
        f'<path d="M18,210 C20,162 50,140 100,138 C150,140 180,162 182,210 Z" fill="{hood}"/>'
        f'<path d="M128,141 C158,150 176,168 180,210 L150,210 C150,180 142,158 128,141Z" fill="{hood2}" opacity=".55"/>'
        f'<path d="M64,142 C70,126 130,126 136,142 C128,160 72,160 64,142Z" fill="{hood2}"/>'
        f'<rect x="88" y="108" width="24" height="34" rx="9" fill="{skin}"/>'
        f'<path d="M88,124 Q100,134 112,124" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="5"/>'
        f'<path d="M91,154 Q89,166 90,178 M109,154 Q111,166 110,178" fill="none" stroke="{P["cream"]}" stroke-width="3" stroke-linecap="round"/>'
        f'<circle cx="90" cy="180" r="3" fill="{P["cream"]}"/><circle cx="110" cy="180" r="3" fill="{P["cream"]}"/>'
        f'<circle cx="138" cy="170" r="10" fill="{P["cream"]}" opacity=".95"/>'
        f'<g>{flame(138, 176.5, 0.17, outer=P["amber"], mid=P["gold"], core=P["cream"], cls="")}</g>'
    )
    # ---- head
    head = (f'<circle cx="{cx-39}" cy="{hy+4}" r="8" fill="{skin}"/><circle cx="{cx+39}" cy="{hy+4}" r="8" fill="{skin}"/>'
            f'<circle cx="{cx}" cy="{hy}" r="40" fill="{skin}"/>')
    # ---- hair in front
    if style in ("short", "long", "bun", "ponytail", "pigtails"):
        front.append(hair_cap(cx, hy, s, hair))
        front.append(hair_shine(cx, hy))
    if style == "curly":
        for ang in range(196, 350, 22):
            r = math.radians(ang)
            front.append(f'<circle cx="{cx+34*math.cos(r):.1f}" cy="{hy-4+34*math.sin(r):.1f}" r="11" fill="{hair}"/>')
    if style == "spiky":
        front.append(hair_cap(cx, hy, s, hair))
        front.append(f'<path d="M62,64 L70,40 L78,56 L88,34 L96,52 L108,32 L114,52 L126,38 L128,58 L140,52 L134,72 Z" fill="{hair}" stroke="{hair}" stroke-width="4" stroke-linejoin="round"/>')
        front.append(hair_shine(cx, hy))
    if style == "beanie":
        hat, hat2 = a["acc"], a["acc2"]
        front.append(hair_cap(cx, hy, s, hair))
        front.append(f'<path d="M58,70 C56,36 76,22 100,22 C124,22 144,36 142,70 Z" fill="{hat}"/>'
                     + "".join(f'<path d="M{x},{30 if abs(x-100) < 30 else 38} V66" stroke="{hat2}" stroke-width="3" stroke-linecap="round" opacity=".55"/>'
                               for x in (74, 87, 100, 113, 126))
                     + f'<rect x="54" y="60" width="92" height="17" rx="8.5" fill="{hat2}"/>'
                     f'<circle cx="100" cy="20" r="11" fill="{P["cream"]}"/>')
    if style == "cap":
        hat, hat2 = a["acc"], a["acc2"]
        front.append(hair_cap(cx, hy, s, hair))
        front.append(f'<path d="M59,70 C58,38 78,26 100,26 C124,26 142,40 141,70 Z" fill="{hat}"/>'
                     f'<path d="M60,70 C80,62 120,62 140,70 L166,74 C172,75 172,82 164,82 L140,80 C120,76 80,76 60,80 Z" fill="{hat2}"/>'
                     f'<circle cx="100" cy="27" r="4" fill="{hat2}"/>'
                     f'<circle cx="112" cy="50" r="8" fill="{P["cream"]}"/>'
                     + sparkle_star(112, 50, 6, hat))
    if style == "hood":
        front.append(f'<path d="M62,74 C62,44 80,40 100,44 C118,40 140,46 138,74 C128,58 112,56 100,60 C88,56 72,58 62,74Z" fill="{hair}"/>')
    face = face_svg(cx, hy, s, a["face"])
    acc = ""
    if a.get("glasses"):
        acc += (f'<g fill="none" stroke="{P["ink"]}" stroke-width="3"><circle cx="85.5" cy="88" r="10"/><circle cx="114.5" cy="88" r="10"/>'
                f'<path d="M95.5,87 Q100,84 104.5,87"/></g>')
    if a.get("freckles"):
        acc += "".join(f'<circle cx="{x}" cy="{y}" r="1.3" fill="{P["ink_l"]}" opacity=".6"/>'
                       for x, y in [(73, 98), (78, 101), (76, 95), (122, 98), (127, 95), (124, 101)])
    pattern = "".join(
        f'<circle cx="{100+68*math.cos(math.radians(t)):.1f}" cy="{100+68*math.sin(math.radians(t)):.1f}" r="2.4" fill="{P["white"]}" opacity=".28"/>'
        for t in range(200, 345, 24))
    body_all = (
        f'<circle cx="100" cy="100" r="98" fill="{P["cream"]}"/>'
        f'<circle cx="100" cy="100" r="91" fill="url(#{p}bg)"/>'
        f'<g clip-path="url(#{p}cl)">{pattern}{"".join(back)}{body}{head}{face}{"".join(front)}{acc}</g>'
        f'<circle cx="100" cy="100" r="91" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="2"/>'
    )
    return svg(200, 200, body_all, defs, anim=False)


AVATARS = [
    dict(bg="#EDB93A", bg2="#F8DC8B", skin=P["skin1"], hair="#5A3A22", hood=P["navy_l"], hood2=P["navy"], style="short", face="happy"),
    dict(bg="#F2994A", bg2="#F9C48F", skin=P["skin2"], hair="#2B1E18", hood=P["sky_d"], hood2="#3F7FB0", style="long", face="kind"),
    dict(bg="#E06456", bg2="#F2A090", skin=P["skin3"], hair="#1E1410", hood=P["cream"], hood2=P["parch_d"], style="curly", face="happy"),
    dict(bg="#EFA3C1", bg2="#F8D2E1", skin=P["skin1"], hair="#8A5530", hood=P["plum_l"], hood2=P["plum"], style="bun", face="calm", freckles=True),
    dict(bg="#9F7AD3", bg2="#CDB6EA", skin=P["skin4"], hair="#1A120E", hood=P["gold"], hood2=P["gold_d"], style="beanie", face="kind", acc=P["coral"], acc2="#C9604A"),
    dict(bg="#5E9ECF", bg2="#A8D2EF", skin=P["skin2"], hair="#3B2618", hood=P["amber"], hood2=P["amber_d"], style="cap", face="happy", acc=P["pine"], acc2="#244A40"),
    dict(bg="#2C3E6B", bg2="#4A6496", skin=P["skin1"], hair="#2A1C14", hood=P["coral"], hood2="#C9654A", style="ponytail", face="happy", acc=P["gold_l"], glasses=True),
    dict(bg="#3FA89B", bg2="#86D1C6", skin=P["skin3"], hair="#24160F", hood=P["plum"], hood2=P["plum_d"], style="spiky", face="kind"),
    dict(bg="#79AE6F", bg2="#B6D9A9", skin=P["skin2"], hair="#6B3F22", hood=P["meadow"], hood2=P["meadow_d"], style="hood", face="calm"),
    dict(bg="#B27C52", bg2="#D9AD84", skin=P["skin4"], hair="#1A110C", hood=P["sky"], hood2=P["sky_d"], style="pigtails", face="happy", acc=P["gold_l"]),
]


def build_avatars():
    # the hooded avatar's hoodie should contrast with its green badge
    AVATARS[8]["hood"], AVATARS[8]["hood2"] = P["gold_l"], P["gold_d"]
    return [write(f"avatars/avatar-{i}.svg", avatar(i, a)) for i, a in enumerate(AVATARS, 1)]


if __name__ == "__main__":
    files = build_icons() + build_logo() + build_avatars()
    for f in files:
        print(os.path.relpath(f, OUT), os.path.getsize(f))
