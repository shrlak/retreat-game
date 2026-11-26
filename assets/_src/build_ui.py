"""UI art for 빛의 원정대: line icons, logo emblem + hand-lettered title, player avatars.

Run from anywhere:  python3 _src/build_ui.py
Writes into the assets dir (parent of _src): icons/, logo*.svg, avatars/.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import P, svg, lin, rad, glow_def, sparkle_star, rays, dove, sheep, flame, face_svg  # noqa: E402

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
# Only transform/opacity are animated, on a handful of elements per file.
SPIN_CSS = ('<style>.spin{transform-box:fill-box;transform-origin:50% 50%;animation:spin 60s linear infinite}'
            '@keyframes spin{to{transform:rotate(360deg)}}'
            '@media (prefers-reduced-motion:reduce){.spin{animation:none}}</style>')

GLASS = ["#8EC5E8", "#F8DC8B", "#B48CE0", "#7FB07A", "#F28B6B", "#F4A259"]


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
        + "".join(f'<circle cx="{cx_}" cy="{cy_}" r="2" fill="{P["gold_l"]}" opacity=".9"/>'
                  for cx_, cy_ in [(-24, 6), (-14, 9), (-3, 10), (8, 9), (18, 6)])
        + f'<path d="M-30,10 Q-4,17 24,9" fill="none" stroke="{P["gold_dd"]}" stroke-width="1.2" opacity=".5"/>'
        + '</g>'
    )
    return body, (x + 50 * s, y - 12 * s)


def stained_arch(cx, top, spring, base, half):
    """Round-topped stained-glass window. Returns svg (panes + lead + frame)."""
    panes, k = [], 0
    r = spring - top
    # fan of panes in the arch head
    n = 6
    for i in range(n):
        a0 = math.pi + i * math.pi / n
        a1 = math.pi + (i + 1) * math.pi / n
        x0, y0 = cx + half * math.cos(a0), spring + r * math.sin(a0)
        x1, y1 = cx + half * math.cos(a1), spring + r * math.sin(a1)
        panes.append(f'<path d="M{cx},{spring} L{x0:.1f},{y0:.1f} A{half},{r} 0 0 1 {x1:.1f},{y1:.1f}Z" fill="{GLASS[k % 6]}"/>')
        k += 1
    # rectangular lights below
    rows = [spring, spring + (base - spring) * 0.42, base]
    cols = [cx - half, cx - half / 3, cx + half / 3, cx + half]
    for ri in range(2):
        for ci in range(3):
            panes.append(f'<rect x="{cols[ci]:.1f}" y="{rows[ri]:.1f}" width="{cols[ci+1]-cols[ci]:.1f}" '
                         f'height="{rows[ri+1]-rows[ri]:.1f}" fill="{GLASS[(k + 2) % 6]}"/>')
            k += 1
    lead = [f'M{cx - half},{spring} H{cx + half}']
    for i in range(1, n):
        a = math.pi + i * math.pi / n
        lead.append(f'M{cx},{spring} L{cx + half * math.cos(a):.1f},{spring + r * math.sin(a):.1f}')
    lead.append(f'M{cols[1]:.1f},{spring} V{base} M{cols[2]:.1f},{spring} V{base} M{cx-half},{rows[1]:.1f} H{cx+half}')
    outline = f'M{cx-half},{base} V{spring} A{half},{r} 0 0 1 {cx+half},{spring} V{base}'
    return (
        f'<g opacity=".62">{"".join(panes)}</g>'
        f'<circle cx="{cx}" cy="{spring}" r="{half*0.3:.1f}" fill="{P["gold_l"]}" opacity=".8"/>'
        f'<path d="{" ".join(lead)}" fill="none" stroke="{P["navy_d"]}" stroke-width="2.4" stroke-linecap="round"/>'
        f'<path d="{outline}" fill="none" stroke="{P["gold"]}" stroke-width="3.2"/>'
        f'<path d="{outline}" fill="none" stroke="{P["gold_l"]}" stroke-width="1" transform="translate(0,1.5)" opacity=".6"/>'
    )


def olive_leaf(x, y, ang, ln, w, fill, rib):
    a = math.radians(ang)
    tx, ty = x + ln * math.cos(a), y + ln * math.sin(a)
    nx, ny = -math.sin(a) * w, math.cos(a) * w
    mx, my = (x + tx) / 2, (y + ty) / 2
    return (f'<path d="M{x:.1f},{y:.1f} Q{mx+nx:.1f},{my+ny:.1f} {tx:.1f},{ty:.1f} Q{mx-nx:.1f},{my-ny:.1f} {x:.1f},{y:.1f}Z" fill="{fill}" stroke="#4F6B2E" stroke-width=".8"/>'
            f'<path d="M{x:.1f},{y:.1f} L{x+(tx-x)*.8:.1f},{y+(ty-y)*.8:.1f}" stroke="{rib}" stroke-width="1" opacity=".7"/>')


def laurel(p, cx, cy, R, a_from, a_to, side):
    """Olive branch along a circle arc (angles in deg, SVG convention)."""
    out = []
    steps = 12
    pts = []
    for i in range(steps + 1):
        a = math.radians(a_from + (a_to - a_from) * i / steps)
        pts.append((cx + R * math.cos(a), cy + R * math.sin(a), a))
    d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y, _ in pts)
    out.append(f'<path d="{d}" fill="none" stroke="#7A5424" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    for i, (x, y, a) in enumerate(pts[1:], 1):
        tang = math.degrees(a) + (90 if side > 0 else -90)  # direction of growth
        ln = 18 - i * 0.45
        out.append(olive_leaf(x, y, tang - 40, ln, 4.4, f"url(#{p}leaf)", P["gold_l"]))
        out.append(olive_leaf(x, y, tang + 40, ln, 4.4, f"url(#{p}leaf2)", P["gold_l"]))
        if i in (3, 7, 10):
            ox = x + 7 * math.cos(a)
            oy = y + 7 * math.sin(a)
            out.append(f'<ellipse cx="{ox:.1f}" cy="{oy:.1f}" rx="3" ry="3.8" fill="{P["plum"]}"/>'
                       f'<circle cx="{ox-1:.1f}" cy="{oy-1.3:.1f}" r="1" fill="{P["lav"]}" opacity=".8"/>')
    x, y, a = pts[-1]
    tang = math.degrees(a) + (90 if side > 0 else -90)
    out.append(olive_leaf(x, y, tang, 13, 3.4, f"url(#{p}leaf)", P["gold_l"]))
    return "".join(out)


def static_stars(seed, n, x0, y0, x1, y1):
    import random
    rnd = random.Random(seed)
    return "".join(f'<circle cx="{rnd.uniform(x0, x1):.1f}" cy="{rnd.uniform(y0, y1):.1f}" r="{rnd.uniform(.8, 1.9):.1f}" '
                   f'fill="#FFF3CF" opacity="{rnd.uniform(.5, 1):.2f}"/>' for _ in range(n))


def emblem_parts(p, animate=True):
    """(defs, body) for the 200x200 emblem: lamp + stained glass in a gold disc ringed by olive branches."""
    C, R = (100, 94), 70
    defs = (
        rad(f"{p}bg", [(0, P["navy_l"]), (0.75, P["navy"]), (1, P["navy_d"])], 0.5, 0.4, 0.62)
        + lin(f"{p}ring", [(0, "#FFF0B8"), (0.3, P["gold"]), (0.55, P["gold_l"]), (0.8, P["gold"]), (1, P["gold_d"])], 0, 0, 1, 1)
        + glow_def(f"{p}glow", "#FFD36E", 0.9)
        + lin(f"{p}clay", [(0, "#F6C27A"), (0.55, "#E39A4E"), (1, "#B9692E")])
        + lin(f"{p}h2", [(0, "#3D6B5E"), (1, P["pine"])])
        + lin(f"{p}h3", [(0, "#2D5548"), (1, "#1F3D35")])
        + lin(f"{p}leaf", [(0, "#B5C46A"), (1, "#6E8A3A")])
        + lin(f"{p}leaf2", [(0, "#97AE55"), (1, "#56702C")])
        + f'<clipPath id="{p}cl"><circle cx="{C[0]}" cy="{C[1]}" r="{R}"/></clipPath>'
    )
    lamp_svg, (fx, fy) = lamp(p, 84, 138, 0.8)
    spin = "spin" if animate else ""
    tw = (lambda c: c) if animate else (lambda c: "")
    inner = (
        f'<circle cx="{C[0]}" cy="{C[1]}" r="{R}" fill="url(#{p}bg)"/>'
        + static_stars(11, 14, 32, 30, 168, 80)
        + stained_arch(100, 42, 82, 150, 34)
        + f'<g class="{tw("glow")}"><circle cx="{fx:.1f}" cy="{fy-12:.1f}" r="62" fill="url(#{p}glow)"/></g>'
        + f'<g class="{spin}">{rays(fx, fy - 12, 16, 16, 84, 4, "#FFD36E", 0.2)}'
          f'<circle cx="{fx:.1f}" cy="{fy-12:.1f}" r="84" fill="none"/></g>'
        + f'<path d="M30,150 C54,140 76,142 100,148 C126,154 150,140 172,144 V200 H30Z" fill="url(#{p}h2)"/>'
        + f'<path d="M30,150 C54,140 76,142 100,148 C126,154 150,140 172,144" fill="none" stroke="{P["gold_l"]}" stroke-width="1.8" opacity=".5"/>'
        + f'<path d="M24,168 C56,158 84,162 106,166 C134,172 154,160 178,162 V200 H24Z" fill="url(#{p}h3)"/>'
        + f'<ellipse cx="86" cy="155" rx="32" ry="4" fill="#000" opacity=".25"/>'
        + lamp_svg
        + flame(round(fx, 1), round(fy, 1), 0.42, cls="fl" if animate else "")
        + dove(58, 62, 0.34, P["cream"], cls="bob" if animate else "")
    )
    ribbon = (
        f'<path d="M86,176 L100,170 L114,176 L110,186 L100,181 L90,186Z" fill="{P["coral"]}" stroke="#A94B37" stroke-width="1.6" stroke-linejoin="round"/>'
        f'<path d="M90,186 L84,197 L92,194 L95,199 L99,184Z M110,186 L116,197 L108,194 L105,199 L101,184Z" fill="#D9694F"/>'
        f'<circle cx="100" cy="176" r="4.5" fill="{P["gold"]}" stroke="{P["gold_dd"]}" stroke-width="1.4"/>'
    )
    glints = ""
    if animate:
        glints = (f'<g class="tw">{sparkle_star(150, 40, 6, P["cream"])}</g>'
                  f'<g class="tw3">{sparkle_star(44, 120, 4.5, P["cream"])}</g>')
    body = (
        laurel(p, C[0], C[1], 84, 98, 222, -1)
        + laurel(p, C[0], C[1], 84, 82, -42, 1)
        + f'<circle cx="{C[0]}" cy="{C[1]}" r="{R+6}" fill="url(#{p}ring)"/>'
        f'<circle cx="{C[0]}" cy="{C[1]}" r="{R+1.5}" fill="{P["gold_dd"]}"/>'
        f'<g clip-path="url(#{p}cl)">{inner}</g>'
        f'<circle cx="{C[0]}" cy="{C[1]}" r="{R-4}" fill="none" stroke="{P["cream"]}" stroke-width="1.2" opacity=".4"/>'
        + "".join(f'<circle cx="{C[0] + (R+3)*math.cos(math.radians(a)):.1f}" cy="{C[1] + (R+3)*math.sin(math.radians(a)):.1f}" r="1.6" fill="{P["gold_dd"]}" opacity=".7"/>'
                  for a in range(0, 360, 15))
        + ribbon + glints
    )
    return defs, body


def emblem_svg(p, animate=True):
    defs, body = emblem_parts(p, animate)
    if animate:
        body = SPIN_CSS + body
    return svg(200, 200, body, defs, anim=animate)


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
    """Gold-leaf lettering: dark shadow, brown outline, banded metallic gold, fine highlight."""
    if light:
        shadow, outline, hi = P["gold_l"], P["gold"], P["gold_l"]
        defs = lin(f"{p}tg", [(0, P["ink_l"]), (0.5, P["ink"]), (1, "#3A281C")])
        hi_op = ".5"
    else:
        shadow, outline, hi = P["navy_d"], "#6E4514", "#FFFBEA"
        defs = lin(f"{p}tg", [(0, "#FFF3C4"), (0.28, P["gold_l"]), (0.5, "#D9A63E"),
                              (0.62, "#F6D27A"), (0.85, P["gold"]), (1, P["gold_d"])])
        hi_op = ".6"
    g = lambda col, w, extra="": (f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w:.1f}" '
                                  f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')
    body = (
        g(shadow, sw * 1.8, ' transform="translate(2.5,4.5)" opacity=".9"')
        + g(outline, sw * 1.55)
        + g(f"url(#{p}tg)", sw)
        + g(hi, sw * 0.2, f' transform="translate(-1.3,-1.8)" opacity="{hi_op}"')
    )
    return defs, body


def flourish(x0, x1, y, col, op=".8"):
    mid = (x0 + x1) / 2
    return (f'<path d="M{x0},{y} Q{(x0+mid)/2},{y-7} {mid-14},{y} M{mid+14},{y} Q{(x1+mid)/2},{y-7} {x1},{y}" '
            f'fill="none" stroke="{col}" stroke-width="2.2" stroke-linecap="round" opacity="{op}"/>'
            f'<path d="M{mid},{y-7} l7,7 -7,7 -7,-7z" fill="{col}" opacity="{op}"/>'
            f'<circle cx="{x0}" cy="{y}" r="2.6" fill="{col}" opacity="{op}"/><circle cx="{x1}" cy="{y}" r="2.6" fill="{col}" opacity="{op}"/>')


def build_logo():
    out = [write("logo-mark.svg", emblem_svg("lm-"))]
    for name, light in (("logo.svg", False), ("logo-light.svg", True)):
        p = "lgl-" if light else "lg-"
        edefs, ebody = emblem_parts(p + "e-")
        k = 0.98
        width_units = 5 * 104 + 38 - 4
        x0 = (640 - width_units * k) / 2
        d, _ = title_d(x0, 176, k)
        tdefs, tbody = title_layers(p, d, 10.5 * k, light)
        sc = P["gold"] if light else "#FFF3C4"
        sparks = (f'<g class="tw">{sparkle_star(x0 + 70, 186, 8, sc)}</g>'
                  f'<g class="tw2">{sparkle_star(640 - x0 - 6, 180, 7, sc)}</g>'
                  f'<g class="tw3">{sparkle_star(x0 + 352, 262, 6, sc)}</g>')
        orn = (flourish(36, 228, 98, P["gold"] if light else P["gold_l"], ".75")
               + flourish(412, 604, 98, P["gold"] if light else P["gold_l"], ".75"))
        body = (SPIN_CSS + orn
                + f'<g transform="translate(232,0) scale(0.88)">{ebody}</g>'
                + tbody + sparks)
        out.append(write(name, svg(640, 300, body, edefs + tdefs)))
    return out


# ============================================================ FAVICON SET
def favicon_svg():
    """64x64, bold lamp + flame on a navy rounded square. No <style>, no animation."""
    p = "fv-"
    defs = (rad(f"{p}bg", [(0, P["navy_l"]), (1, P["navy_d"])], 0.62, 0.3, 0.8)
            + glow_def(f"{p}gl", "#FFD36E", 0.95)
            + lin(f"{p}clay", [(0, "#FFD488"), (0.6, "#F0A955"), (1, "#C9762F")]))
    body = (
        f'<rect width="64" height="64" rx="14" fill="url(#{p}bg)"/>'
        f'<rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="{P["gold"]}" stroke-width="2.4"/>'
        f'<circle cx="48" cy="20" r="24" fill="url(#{p}gl)"/>'
        # lamp
        f'<path d="M5.5,37 C5.5,29.5 16,26.5 28,27.5 C36,28 41,29.5 45,31.5 L52,29.5 C55,28.8 56.5,31.6 54.5,33.4 L48,39 '
        f'C43.5,45.5 35,48.5 27,48.5 C14,48.5 5.5,44.5 5.5,37Z" fill="url(#{p}clay)" stroke="{P["gold_dd"]}" stroke-width="1.6" stroke-linejoin="round"/>'
        f'<ellipse cx="27" cy="50.5" rx="9" ry="3" fill="{P["gold_d"]}"/>'
        f'<ellipse cx="24" cy="29.6" rx="6.5" ry="1.8" fill="{P["gold_dd"]}" opacity=".8"/>'
        f'<path d="M10.5,35 C12,31.5 18,30 23,30" fill="none" stroke="#FFF6E5" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>'
        # flame
        f'<path d="M52,28 C45,27.5 44,20 47.5,14.5 C49.5,11.5 51,8 51.5,4 C54,9 58.5,13 58.5,19.5 C58.5,24.5 56,28 52,28Z" fill="#F6A04D"/>'
        f'<path d="M52,27 C48,26.5 47.5,21.5 49.5,18 C50.6,16 51.3,14 51.6,12 C53.4,15 55.6,17.6 55.6,21.6 C55.6,24.8 54.3,27 52,27Z" fill="#FFD36E"/>'
        f'<ellipse cx="52" cy="23.5" rx="1.8" ry="3.2" fill="#FFF6D8"/>'
    )
    return svg(64, 64, body, defs, anim=False)


def app_icon_svg(size_units=200, mark_scale=0.76):
    """Full-bleed navy square with the (static) emblem centred."""
    p = "ai-"
    edefs, ebody = emblem_parts(p + "e-", animate=False)
    s = mark_scale
    off = (200 - 200 * s) / 2
    defs = edefs + rad(f"{p}bg", [(0, P["navy_l"]), (1, P["navy_d"])], 0.5, 0.42, 0.75)
    body = (f'<rect width="200" height="200" fill="url(#{p}bg)"/>'
            f'<g transform="translate({off:.2f},{off + 3 * s:.2f}) scale({s})">{ebody}</g>')
    return svg(200, 200, body, defs, anim=False)


def build_favicons():
    import cairosvg
    out = []
    fav = favicon_svg()
    out.append(write("icons/favicon.svg", fav))
    for n in (16, 32):
        path = os.path.join(OUT, f"icons/favicon-{n}.png")
        cairosvg.svg2png(bytestring=fav.encode(), write_to=path, output_width=n, output_height=n)
        out.append(path)
    app = app_icon_svg(mark_scale=0.76).encode()     # ~12% padding each side
    mask = app_icon_svg(mark_scale=0.74).encode()    # emblem inside the 80% safe circle
    for name, src, n in (("apple-touch-icon.png", app, 180), ("icon-192.png", app, 192),
                         ("icon-512.png", app, 512), ("icon-maskable-512.png", mask, 512)):
        path = os.path.join(OUT, f"icons/{name}")
        cairosvg.svg2png(bytestring=src, write_to=path, output_width=n, output_height=n)
        out.append(path)
    return out


# ================================================================= AVATARS
# Bible-times villagers: tunics with clavi stripes, mantles, head-cloths, veils, turbans.
def hair_cap(cx, hy, s, col):
    S = lambda v: v * s
    return (f'<path d="M{cx-S(43):.1f},{hy+S(4):.1f} C{cx-S(48):.1f},{hy-S(40):.1f} {cx-S(20):.1f},{hy-S(50):.1f} {cx:.1f},{hy-S(48):.1f} '
            f'C{cx+S(26):.1f},{hy-S(50):.1f} {cx+S(50):.1f},{hy-S(38):.1f} {cx+S(43):.1f},{hy+S(4):.1f} '
            f'C{cx+S(36):.1f},{hy-S(16):.1f} {cx+S(20):.1f},{hy-S(22):.1f} {cx+S(6):.1f},{hy-S(20):.1f} '
            f'Q{cx-S(6):.1f},{hy-S(30):.1f} {cx-S(18):.1f},{hy-S(18):.1f} C{cx-S(30):.1f},{hy-S(16):.1f} {cx-S(38):.1f},{hy-S(8):.1f} {cx-S(43):.1f},{hy+S(4):.1f}Z" fill="{col}"/>')


def curls(hair, cx=100, cy=82, R=36, a0=196, a1=344, step=21, r=10.5):
    return "".join(f'<circle cx="{cx+R*math.cos(math.radians(a)):.1f}" cy="{cy+R*math.sin(math.radians(a)):.1f}" r="{r}" fill="{hair}"/>'
                   for a in range(a0, a1 + 1, step))


def beard(col, short=True):
    if short:
        return (f'<path d="M62,92 C62,126 82,136 100,136 C118,136 138,126 138,92 C132,108 120,118 100,118 '
                f'C80,118 68,108 62,92Z" fill="{col}"/>')
    return (f'<path d="M62,92 C60,134 82,150 100,152 C118,150 140,134 138,92 C132,110 120,120 100,120 '
            f'C80,120 68,110 62,92Z" fill="{col}"/>'
            f'<path d="M86,112 Q93,107 100,111 Q107,107 114,112" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round"/>')


def avatar(i, a):
    p = f"av{i}-"
    cx, hy = 100, 86
    s = 40 / 42
    skin, hair, tun, tun2 = a["skin"], a["hair"], a["tunic"], a["tunic2"]
    st = a["style"]
    w1, w2 = a.get("wrap", P["cream"]), a.get("wrap2", P["parch_d"])
    defs = (rad(f"{p}bg", [(0, a["bg2"]), (1, a["bg"])], 0.5, 0.35, 0.7)
            + f'<clipPath id="{p}cl"><circle cx="100" cy="100" r="91"/></clipPath>')
    back, drape, front = [], [], []

    # ---------- behind the shoulders
    if st == "braid":
        back.append(f'<path d="M128,92 C146,110 144,140 136,170" fill="none" stroke="{hair}" stroke-width="15" stroke-linecap="round"/>'
                    + "".join(f'<path d="M{129+t*0.2:.1f},{108+t:.1f} q7,4 0,10" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>' for t in (6, 22, 38)))
    if st in ("curly", "wreath"):
        back.append(curls(hair, R=42, a0=150, a1=390, step=24, r=15))

    # ---------- tunic
    body = (
        f'<path d="M16,214 C18,164 50,142 100,140 C150,142 182,164 184,214 Z" fill="{tun}"/>'
        f'<path d="M72,146 V214 M128,146 V214" stroke="{a["stripe"]}" stroke-width="7"/>'
        f'<path d="M84,140 L100,162 L116,140 Z" fill="{skin}"/>'
        f'<path d="M80,139 L100,165 L120,139" fill="none" stroke="{tun2}" stroke-width="4" stroke-linejoin="round"/>'
    )
    if a.get("mantle"):
        m1, m2 = a["mantle"]
        body += (f'<path d="M14,214 C14,170 36,146 70,140 C80,170 104,196 124,214 Z" fill="{m1}"/>'
                 f'<path d="M40,168 Q58,186 70,214 M58,152 Q76,180 96,206" fill="none" stroke="{m2}" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
    body += (f'<rect x="88" y="108" width="24" height="36" rx="9" fill="{skin}"/>'
             f'<path d="M88,124 Q100,134 112,124" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="5"/>')

    # ---------- cloth falling to the shoulders (drawn over tunic, under the head)
    if st in ("cloth", "elder", "shepherd"):
        drape.append(f'<path d="M54,84 C50,50 70,34 100,34 C130,34 150,50 146,84 L160,154 C148,162 130,158 122,146 '
                     f'L78,146 C70,158 52,162 40,154 Z" fill="{w1}"/>'
                     f'<path d="M50,104 L44,150 M150,104 L156,150" stroke="{w2}" stroke-width="3" stroke-linecap="round" opacity=".8"/>')
    if st in ("veil", "coins"):
        drape.append(f'<path d="M52,80 C48,40 72,26 100,26 C128,26 152,40 148,80 L168,172 C150,180 130,168 124,150 '
                     f'L76,150 C70,168 50,180 32,172 Z" fill="{w1}"/>'
                     f'<path d="M50,110 Q42,140 40,168 M150,110 Q158,140 160,168" fill="none" stroke="{w2}" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
    if st == "hood":
        drape.append(f'<path d="M50,92 C44,44 70,26 100,26 C130,26 156,44 150,92 L164,160 C140,168 120,150 116,140 '
                     f'L84,140 C80,150 60,168 36,160 Z" fill="{w1}"/>')

    # ---------- head
    ears = st not in ("cloth", "elder", "shepherd", "veil", "coins", "hood")
    head = ""
    if ears:
        head += f'<circle cx="{cx-39}" cy="{hy+4}" r="8" fill="{skin}"/><circle cx="{cx+39}" cy="{hy+4}" r="8" fill="{skin}"/>'
    head += f'<circle cx="{cx}" cy="{hy}" r="40" fill="{skin}"/>'

    # ---------- in front of the face
    if st in ("cloth", "elder", "shepherd"):
        front.append(f'<path d="M57,84 C54,46 76,36 100,36 C124,36 146,46 143,84 C132,66 118,60 100,60 '
                     f'C82,60 68,66 57,84Z" fill="{w1}"/>'
                     f'<path d="M62,64 C78,54 122,54 138,64" fill="none" stroke="{w2}" stroke-width="2.5" opacity=".7"/>'
                     f'<path d="M57,72 C74,58 126,58 143,72" fill="none" stroke="{a.get("cord", P["ink"])}" stroke-width="6.5" stroke-linecap="round"/>')
    if st in ("veil", "coins"):
        front.append(f'<path d="M62,84 C64,62 80,54 100,54 C120,54 136,62 138,84 C128,72 114,66 100,68 '
                     f'C86,66 72,72 62,84Z" fill="{hair}"/>'
                     f'<path d="M56,88 C52,46 76,30 100,30 C124,30 148,46 144,88 C138,64 120,50 100,50 '
                     f'C80,50 62,64 56,88Z" fill="{w1}"/>'
                     f'<path d="M60,74 C72,52 128,52 140,74" fill="none" stroke="{w2}" stroke-width="2.5" opacity=".7"/>')
        if st == "coins":
            for t in range(-4, 5):
                x = 100 + t * 9
                y = 58 + 0.9 * t * t
                front.append(f'<circle cx="{x}" cy="{y:.1f}" r="4.4" fill="{P["gold"]}" stroke="{P["gold_dd"]}" stroke-width="1.2"/>')
    if st == "hood":
        front.append(f'<path d="M62,74 C62,50 80,46 100,48 C120,46 138,50 138,74 C128,62 112,60 100,62 C88,60 72,62 62,74Z" fill="{hair}"/>'
                     f'<path d="M56,92 C50,48 74,34 100,34 C126,34 150,48 144,92 C138,62 120,48 100,48 C80,48 62,62 56,92Z" fill="{w1}"/>'
                     f'<path d="M58,90 C54,56 76,42 100,42" fill="none" stroke="{w2}" stroke-width="3" opacity=".7"/>')
    if st == "turban":
        front.append(hair_cap(cx, hy, s, hair))
        front.append(f'<path d="M55,76 C50,36 76,18 100,18 C124,18 150,36 145,76 C130,66 70,66 55,76Z" fill="{w1}"/>'
                     f'<path d="M58,62 C80,40 120,32 140,46 M60,72 C84,52 124,46 144,60 M78,26 C96,40 118,56 136,70" '
                     f'fill="none" stroke="{w2}" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>'
                     f'<circle cx="100" cy="48" r="5.5" fill="{a.get("gem", P["coral"])}" stroke="{P["gold"]}" stroke-width="2"/>')
    if st == "headband":
        front.append(hair_cap(cx, hy, s, hair) + curls(hair, cy=hy - 6, R=34, a0=200, a1=340, step=28, r=9))
        front.append(f'<path d="M58,70 C76,58 124,58 142,70" fill="none" stroke="{w1}" stroke-width="9" stroke-linecap="round"/>'
                     f'<path d="M140,70 Q154,72 160,86 M140,70 Q156,66 164,74" fill="none" stroke="{w1}" stroke-width="5.5" stroke-linecap="round"/>'
                     f'<path d="M62,68 C80,58 120,58 138,68" fill="none" stroke="{w2}" stroke-width="2" opacity=".8"/>')
    if st == "braid":
        front.append(hair_cap(cx, hy, s, hair))
        front.append(f'<path d="M56,76 C54,44 76,32 100,32 C124,32 146,44 144,76 C128,60 72,60 56,76Z" fill="{w1}"/>'
                     + "".join(f'<circle cx="{x}" cy="{y}" r="2.6" fill="{w2}"/>' for x, y in [(72, 54), (88, 44), (104, 42), (120, 46), (134, 58), (96, 58), (114, 58)])
                     + f'<path d="M140,70 L154,62 L150,78Z" fill="{w1}"/>')
    if st in ("curly", "wreath"):
        front.append(curls(hair, cy=hy - 4, R=34, a0=196, a1=344, step=21, r=11))
    if st == "wreath":
        leaves = []
        for t in range(-5, 6):
            if t == 0:
                continue
            ang = -90 + t * 15
            x = 100 + 40 * math.cos(math.radians(ang))
            y = 92 + 40 * math.sin(math.radians(ang)) - 4
            dirn = ang + (90 if t > 0 else -90)
            leaves.append(olive_leaf(x, y, dirn - 25 * (1 if t > 0 else -1), 11, 3.4, "#8DA24E", P["gold_l"]))
        front.append(f'<path d="M62,74 C74,50 126,50 138,74" fill="none" stroke="#6E8A3A" stroke-width="2.5"/>' + "".join(leaves))

    face = face_svg(cx, hy, s, a["face"])
    acc = ""
    if st == "elder":
        acc += beard(a.get("beard", "#EDE6D8"), short=False)
    elif a.get("beard"):
        acc += beard(a["beard"])
    if a.get("freckles"):
        acc += "".join(f'<circle cx="{x}" cy="{y}" r="1.3" fill="{P["ink_l"]}" opacity=".6"/>'
                       for x, y in [(73, 98), (78, 101), (76, 95), (122, 98), (127, 95), (124, 101)])
    if st == "shepherd":
        acc += f'<g transform="translate(170,166) scale(-1,1)">{sheep(0, 0, 0.36, cls="")}</g>'
    if a.get("net"):
        acc += ('<g fill="none" stroke="%s" stroke-width="1.6" opacity=".55">' % P["parch_d"]
                + "".join(f'<path d="M{x},150 L{x+30},214"/><path d="M{x+30},150 L{x},214"/>' for x in (120, 136, 152))
                + '</g>')
    pattern = "".join(
        f'<circle cx="{100+70*math.cos(math.radians(t)):.1f}" cy="{100+70*math.sin(math.radians(t)):.1f}" r="2.2" fill="#FFFFFF" opacity=".3"/>'
        for t in range(204, 340, 22))
    return svg(200, 200,
               f'<circle cx="100" cy="100" r="98" fill="{P["cream"]}"/>'
               f'<circle cx="100" cy="100" r="91" fill="url(#{p}bg)"/>'
               f'<g clip-path="url(#{p}cl)">{pattern}{"".join(back)}{body}{"".join(drape)}{head}{face}{"".join(front)}{acc}</g>'
               f'<circle cx="100" cy="100" r="91" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="2"/>',
               defs, anim=False)


AVATARS = [
    # 1 shepherd with a lamb over the shoulder
    dict(bg="#EDB93A", bg2="#F8DC8B", skin=P["skin2"], hair="#3B2618", tunic="#B9692E", tunic2="#8E4F22", stripe=P["cream"],
         style="shepherd", face="happy", wrap=P["cream"], wrap2="#C9604A", cord="#5A3A22"),
    # 2 young woman in a blue veil
    dict(bg="#F2994A", bg2="#F9C48F", skin=P["skin1"], hair="#5A3A22", tunic=P["cream"], tunic2=P["parch_d"], stripe="#5E9ECF",
         style="veil", face="kind", wrap="#4A78B5", wrap2="#2F5A92"),
    # 3 fisherman with headband, short beard and net
    dict(bg="#E06456", bg2="#F2A090", skin=P["skin3"], hair="#1E1410", tunic="#5E8F9C", tunic2="#3E6A76", stripe=P["parch"],
         style="headband", face="happy", wrap=P["cream"], wrap2="#C9604A", beard="#1E1410", net=True),
    # 4 girl with a dotted kerchief and a braid
    dict(bg="#EFA3C1", bg2="#F8D2E1", skin=P["skin1"], hair="#8A5530", tunic=P["meadow"], tunic2=P["meadow_d"], stripe=P["cream"],
         style="braid", face="calm", wrap=P["coral"], wrap2=P["cream"], freckles=True),
    # 5 man in a saffron turban with a mantle
    dict(bg="#9F7AD3", bg2="#CDB6EA", skin=P["skin4"], hair="#1A120E", tunic=P["parch"], tunic2=P["parch_d"], stripe="#7E57A6",
         style="turban", face="kind", wrap=P["gold"], wrap2=P["gold_d"], gem=P["coral"], beard="#1A120E",
         mantle=(P["plum"], P["plum_d"])),
    # 6 child with an olive wreath
    dict(bg="#5E9ECF", bg2="#A8D2EF", skin=P["skin2"], hair="#3B2618", tunic=P["amber"], tunic2=P["amber_d"], stripe=P["cream"],
         style="wreath", face="happy"),
    # 7 woman with a coin headband and red veil
    dict(bg="#2C3E6B", bg2="#4A6496", skin=P["skin3"], hair="#24160F", tunic=P["gold_l"], tunic2=P["gold_d"], stripe="#C8553D",
         style="coins", face="happy", wrap="#C8553D", wrap2="#9C3B28"),
    # 8 traveller with mantle pulled over the head
    dict(bg="#3FA89B", bg2="#86D1C6", skin=P["skin1"], hair="#6B3F22", tunic=P["cream"], tunic2=P["parch_d"], stripe=P["pine"],
         style="hood", face="kind", wrap="#7A5C46", wrap2="#5A4030"),
    # 9 kind elder with a white beard and striped head-cloth
    dict(bg="#79AE6F", bg2="#B6D9A9", skin=P["skin2"], hair="#EDE6D8", tunic="#4A78B5", tunic2="#2F5A92", stripe=P["gold_l"],
         style="elder", face="calm", wrap=P["cream"], wrap2="#4A78B5", cord="#3B2A22"),
    # 10 curly-haired youth with a sash
    dict(bg="#B27C52", bg2="#D9AD84", skin=P["skin4"], hair="#1A110C", tunic=P["sky"], tunic2=P["sky_d"], stripe=P["navy_l"],
         style="curly", face="happy", mantle=(P["coral"], "#C9654A")),
]


def build_avatars():
    return [write(f"avatars/avatar-{i}.svg", avatar(i, a)) for i, a in enumerate(AVATARS, 1)]


if __name__ == "__main__":
    files = build_icons() + build_logo() + build_favicons() + build_avatars()
    for f in files:
        print(os.path.relpath(f, OUT), os.path.getsize(f))
