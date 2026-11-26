"""Evil-team (유혹의 무리) role cards for 빛의 원정대.

Writes into ../roles/:
  assassin.svg  정탐꾼            (ras_)  spy on a Jericho-style city wall
  morgana.svg   거짓 선지자       (rmo_)  false prophet with a smiling mask
  mordred.svg   양의 탈을 쓴 늑대 (rmd_)  wolf in a sheep costume, shepherd field
  oberon.svg    방황하는 자       (rob_)  lone wanderer in the misty desert
  minion.svg    유혹하는 자       (rmi_)  cheeky serpent in the garden of Eden

Mischievous and cheeky, never scary. No text in the art.
Motion: only lib classes (tw/fl/glow/drift/bob), at most ~10 animated
elements per card, never on an element that carries transform="".
Run from _src:  python3 build_roles_evil.py
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import P, card, figure, flame, sheep, sparkle_star, glow_def, rad, lin  # noqa: E402

OUT = os.path.normpath(os.path.join(HERE, "..", "roles"))

X0, Y0, X1, Y1 = 30, 30, 570, 680  # art window


# ------------------------------------------------------------------ helpers
def bg(p, top, mid, bot):
    return (lin(f"{p}sky", [(0, top), (0.55, mid), (1, bot)]),
            f'<rect x="{X0}" y="{Y0}" width="540" height="650" fill="url(#{p}sky)"/>')


def glow(id_, cx, cy, r, cls="glow"):
    c = f' class="{cls}"' if cls else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{id_})"{c}/>'


def starfield(seed, n, x0, y0, x1, y1, color="#FFF6D8", twinkle=3, sparkles=2, avoid=None):
    """Mostly static stars; only `twinkle` of them animate (keeps phones smooth)."""
    rnd = random.Random(seed)
    out, k = [], 0
    cls = ["tw", "tw2", "tw3"]
    while k < n:
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        if avoid and (x - avoid[0]) ** 2 + (y - avoid[1]) ** 2 < avoid[2] ** 2:
            continue
        r = rnd.uniform(1.1, 2.6)
        if k < sparkles:
            out.append(sparkle_star(x, y, r * 3.4, color, cls[k % 3] if k < twinkle else ""))
        else:
            c = f' class="{cls[k % 3]}"' if k < twinkle else ""
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{color}"{c}/>')
        k += 1
    return "".join(out)


def palm(x, base, h, lean, col, s=1.0):
    tx, ty = x + lean, base - h
    o = [f'<path d="M{x},{base} Q{x+lean*0.2:.1f},{base-h*0.55:.1f} {tx},{ty}" fill="none" stroke="{col}" '
         f'stroke-width="{9*s:.1f}" stroke-linecap="round"/>']
    for ang, ln, droop in [(-170, 70, 26), (-140, 64, 30), (-100, 46, 10), (-60, 50, 14), (-30, 66, 30), (0, 70, 26), (-80, 40, 4)]:
        a = math.radians(ang)
        ex, ey = tx + math.cos(a) * ln * s, ty + math.sin(a) * ln * s + droop * s
        mx, my = (tx + ex) / 2, (ty + ey) / 2 - 16 * s
        nx, ny = -(ey - ty), (ex - tx)
        L = math.hypot(nx, ny) or 1
        w = 9 * s
        o.append(f'<path d="M{tx},{ty} Q{mx+nx/L*w:.1f},{my+ny/L*w:.1f} {ex:.1f},{ey:.1f} Q{mx-nx/L*w:.1f},{my-ny/L*w:.1f} {tx},{ty}Z" fill="{col}"/>')
    return "".join(o)


def olive(x, base, s, trunk, leaf, leaf2):
    S = lambda v: v * s
    o = [f'<path d="M{x-S(16):.1f},{base} C{x-S(4):.1f},{base-S(40):.1f} {x-S(26):.1f},{base-S(70):.1f} {x-S(8):.1f},{base-S(100):.1f} '
         f'L{x+S(10):.1f},{base-S(100):.1f} C{x+S(2):.1f},{base-S(70):.1f} {x+S(22):.1f},{base-S(40):.1f} {x+S(18):.1f},{base}Z" fill="{trunk}"/>']
    blobs = [(-60, -120, 44, 28), (-10, -150, 56, 34), (54, -126, 46, 28), (-30, -100, 40, 22), (30, -100, 44, 22), (0, -128, 50, 30)]
    o.append(f'<g fill="{leaf}">' + "".join(
        f'<ellipse cx="{x+S(dx):.1f}" cy="{base+S(dy):.1f}" rx="{S(rx):.1f}" ry="{S(ry):.1f}"/>' for dx, dy, rx, ry in blobs) + '</g>')
    o.append(f'<g fill="{leaf2}">' + "".join(
        f'<ellipse cx="{x+S(dx-8):.1f}" cy="{base+S(dy-8):.1f}" rx="{S(rx*0.55):.1f}" ry="{S(ry*0.45):.1f}"/>' for dx, dy, rx, ry in blobs[:3]) + '</g>')
    return "".join(o)


def fog_band(id_, cx, cy, rx, ry, delay=0):
    st = f' style="animation-delay:{delay}s"' if delay else ""
    return f'<g class="drift"{st}><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#{id_})"/></g>'


def stone_rows(x0, x1, y0, y1, row_h, colors, seed, mortar):
    """Dry-stone / masonry blocks filling a rectangle."""
    rnd = random.Random(seed)
    o = []
    y = y0
    row = 0
    while y < y1:
        x = x0 - (row % 2) * row_h * 0.9
        while x < x1:
            w = rnd.uniform(row_h * 1.3, row_h * 2.2)
            c = rnd.choice(colors)
            o.append(f'<rect x="{x+2:.1f}" y="{y+2:.1f}" width="{w-4:.1f}" height="{row_h-4:.1f}" rx="{row_h*0.22:.1f}" fill="{c}"/>')
            x += w
        y += row_h
        row += 1
    return f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{mortar}"/>' + "".join(o)


# ===================================================================== 정탐꾼
def assassin():
    p = "ras_"
    d_sky, sky = bg(p, "#121A36", "#24346A", "#46457E")
    defs = d_sky
    defs += glow_def(f"{p}mglow", "#F3E9C6", 0.55)
    defs += glow_def(f"{p}rim", "#B9C4FF", 0.45)
    defs += glow_def(f"{p}glint", "#FFF3C4", 1)
    defs += glow_def(f"{p}win", "#FFC870", 0.9)
    defs += lin(f"{p}brass", [(0, "#FBE3A0"), (0.45, "#E2A945"), (1, "#8A5A1C")], 0, 0, 0, 1)
    defs += lin(f"{p}wall", [(0, "#8E86B0"), (1, "#4B4570")])
    s = [sky]
    # moon (kept clear of the arched top corners) + stars
    s.append(glow(f"{p}mglow", 160, 170, 160))
    s.append('<circle cx="160" cy="170" r="54" fill="#F6EED2"/>'
             '<circle cx="143" cy="158" r="9" fill="#E7DDB8"/><circle cx="176" cy="188" r="11" fill="#E7DDB8"/>'
             '<circle cx="170" cy="146" r="5" fill="#E7DDB8"/>')
    s.append(starfield(11, 34, 60, 60, 550, 320, twinkle=4, sparkles=3, avoid=(160, 170, 80)))
    # Judean hills, palms, distant flat-roofed houses
    s.append('<path d="M30,410 Q120,350 230,380 T430,360 T570,372 V680 H30Z" fill="#2A3468"/>')
    s.append(palm(78, 440, 150, -12, "#1A2350", 1.0))
    s.append(palm(520, 440, 170, 14, "#18204A", 1.1))
    s.append(palm(470, 440, 110, -10, "#1F2A5C", 0.8))
    houses = [(150, 400, 58, 46), (205, 388, 50, 58), (250, 404, 64, 42), (330, 394, 54, 52), (380, 408, 70, 40)]
    for (hx_, hy_, w, h) in houses:
        s.append(f'<rect x="{hx_}" y="{hy_}" width="{w}" height="{h+60}" fill="#232C5E"/>'
                 f'<rect x="{hx_-3}" y="{hy_-5}" width="{w+6}" height="7" rx="2" fill="#2E386E"/>')
    for (wx, wy) in [(170, 418), (222, 410), (348, 414), (272, 422)]:
        s.append(f'<rect x="{wx}" y="{wy}" width="10" height="13" rx="5" fill="#FFC870"/>')
    s.append(glow(f"{p}win", 227, 416, 26, cls="glow"))
    # rim-light halo behind the spy
    s.append(glow(f"{p}rim", 300, 400, 210, cls=""))
    # the spy (head and shoulders above the wall)
    sc = 1.6
    cx, hy_target = 290, 392
    by = hy_target + 252 * sc
    robe, robe2 = "#3E4596", "#2A2F6E"
    body, hands, (hx, hy) = figure(cx, by, sc, robe, robe2, P["skin2"], "#3B2A22", "hood", "peek",
                                   arms=[("L", 168, 528), ("R", 420, 404)], hood_col="#4A52A8")
    s.append(body)
    S = lambda v: v * sc
    # cheeky grin + raised brow over the open eye
    s.append(f'<path d="M{hx-S(12):.1f},{hy+S(17):.1f} Q{hx+S(4):.1f},{hy+S(32):.1f} {hx+S(18):.1f},{hy+S(14):.1f} Z" fill="#7A2E2E"/>'
             f'<path d="M{hx-S(9):.1f},{hy+S(18):.1f} L{hx+S(15):.1f},{hy+S(16):.1f} L{hx+S(13):.1f},{hy+S(20):.1f} L{hx-S(6):.1f},{hy+S(21):.1f}Z" fill="#fff"/>')
    s.append(f'<path d="M{hx-S(26):.1f},{hy-S(10):.1f} Q{hx-S(16):.1f},{hy-S(18):.1f} {hx-S(6):.1f},{hy-S(10):.1f}" fill="none" stroke="#3B2A22" stroke-width="{S(3):.1f}" stroke-linecap="round"/>')
    # brass spyglass at the right eye, angled up-right
    ex, ey = hx + S(15), hy + S(3)
    ang = math.radians(-20)

    def pt(t, o=0):
        return (ex + t * math.cos(ang) - o * math.sin(ang), ey + t * math.sin(ang) + o * math.cos(ang))

    def seg(t0, t1, r0, r1, fill):
        a, b, c, d = pt(t0, -r0), pt(t1, -r1), pt(t1, r1), pt(t0, r0)
        return f'<path d="M{a[0]:.1f},{a[1]:.1f} L{b[0]:.1f},{b[1]:.1f} L{c[0]:.1f},{c[1]:.1f} L{d[0]:.1f},{d[1]:.1f}Z" fill="{fill}"/>'
    s.append(seg(-6, 70, 15, 15, f"url(#{p}brass)"))
    s.append(seg(64, 76, 19, 19, "#8A5A1C"))
    s.append(seg(70, 150, 20, 20, f"url(#{p}brass)"))
    s.append(seg(144, 158, 25, 25, "#8A5A1C"))
    s.append(seg(152, 210, 26, 30, f"url(#{p}brass)"))
    s.append(seg(204, 216, 33, 33, "#B9832A"))
    s.append(seg(30, 36, 16, 16, "#F8DC8B") + seg(110, 116, 21, 21, "#F8DC8B"))
    lx, ly = pt(216)
    s.append(f'<ellipse cx="{lx:.1f}" cy="{ly:.1f}" rx="10" ry="31" transform="rotate(-20 {lx:.1f} {ly:.1f})" fill="#9FD3F2"/>'
             f'<ellipse cx="{lx+2:.1f}" cy="{ly-8:.1f}" rx="4" ry="11" transform="rotate(-20 {lx:.1f} {ly:.1f})" fill="#fff" opacity=".85"/>')
    s.append(glow(f"{p}glint", round(lx + 6), round(ly - 6), 46))
    s.append(sparkle_star(lx + 8, ly - 10, 26, "#FFF8DC", "tw"))
    s.append(sparkle_star(lx + 30, ly - 40, 9, "#FFF8DC", "tw3"))
    # the city wall in front: parapet with merlons and masonry
    wall_top = 512
    s.append(f'<g>{stone_rows(30, 570, wall_top, 680, 34, ["#837BA6", "#776F9B", "#8C84AE", "#6F6893"], 5, "#4B4570")}</g>')
    for mx in (30, 470):  # merlons either side of the gap the spy peeks through
        s.append(f'<rect x="{mx}" y="{wall_top-58}" width="100" height="62" rx="6" fill="#857DA8"/>'
                 f'<rect x="{mx}" y="{wall_top-58}" width="100" height="10" rx="5" fill="#A7A0C8"/>'
                 f'<path d="M{mx+8},{wall_top-24} H{mx+92}" stroke="#4B4570" stroke-width="3" opacity=".6"/>')
    s.append(f'<rect x="30" y="{wall_top-6}" width="540" height="14" rx="5" fill="#A7A0C8"/>')
    # a little window lower in the wall with a scarlet cord tied to it
    s.append('<path d="M420,600 v-28 a22,22 0 0,1 44,0 v28Z" fill="#2A2444"/>'
             '<path d="M420,600 h44" stroke="#A7A0C8" stroke-width="6" stroke-linecap="round"/>'
             '<path d="M436,600 C430,624 446,644 438,682" fill="none" stroke="#D6324A" stroke-width="7" stroke-linecap="round"/>'
             '<path d="M436,600 C430,624 446,644 438,682" fill="none" stroke="#FF7A86" stroke-width="2" stroke-dasharray="4 7" stroke-linecap="round"/>'
             '<circle cx="436" cy="600" r="6" fill="#D6324A"/>')
    s.append(hands)
    s.append(f'<g fill="{P["skin2"]}"><circle cx="156" cy="540" r="7"/><circle cx="170" cy="543" r="7"/><circle cx="184" cy="540" r="7"/></g>')
    return p, "".join(s), defs


# ===================================================================== 거짓 선지자
def morgana():
    p = "rmo_"
    d_sky, sky = bg(p, "#2A1844", "#5B3A7A", "#C07AA8")
    defs = d_sky
    defs += glow_def(f"{p}moon", "#F5ECFF", 0.6)
    defs += glow_def(f"{p}vio", "#A77BFF", 0.9)
    defs += glow_def(f"{p}gold", "#FFE7A3", 0.8)
    defs += lin(f"{p}mask", [(0, "#FFF0BE"), (0.5, "#F2C65A"), (1, "#C58C2C")], 0, 0, 0.6, 1)
    defs += lin(f"{p}lamp", [(0, "#F8DC8B"), (0.5, "#E2A945"), (1, "#9C6420")])
    s = [sky]
    s.append(glow(f"{p}moon", 380, 220, 230))
    s.append('<circle cx="380" cy="220" r="116" fill="#EEE6FA"/>'
             '<circle cx="345" cy="190" r="16" fill="#DDD1F0"/><circle cx="420" cy="260" r="22" fill="#DDD1F0"/>'
             '<circle cx="410" cy="170" r="9" fill="#DDD1F0"/>')
    s.append(starfield(21, 26, 60, 70, 550, 380, color="#F3E8FF", twinkle=2, sparkles=3, avoid=(380, 220, 140)))
    # Judean hills with olive trees, palms and a low stone wall
    s.append('<path d="M30,540 Q150,486 290,520 T570,500 V680 H30Z" fill="#4A2F66"/>')
    s.append(palm(540, 520, 150, 10, "#3A2550", 0.9))
    s.append(olive(80, 540, 0.75, "#2E1D42", "#3A2550", "#4A3266"))
    s.append(olive(470, 540, 0.6, "#2E1D42", "#3A2550", "#4A3266"))
    s.append('<path d="M30,600 Q200,566 340,590 T570,580 V680 H30Z" fill="#2A1844"/>')
    s.append('<g fill="#3E2A58">' + "".join(
        f'<ellipse cx="{x}" cy="{596 - (x-30)*0.02 + (6 if (x//34)%2 else 0):.0f}" rx="18" ry="11"/>' for x in range(36, 570, 32)) + '</g>')
    # prophet
    sc = 1.28
    cx = 316
    hy_t = 330
    by = hy_t + 252 * sc
    hair = "#D8D0EE"
    body, hands, (hx, hy) = figure(cx, by, sc, "#5B3A7A", "#3A2550", P["skin1"], hair, "long", "sly",
                                   arms=[("L", 168, 470), ("R", 470, 526)], trim=P["gold"], stole="#7E57A6")
    s.append(body)
    S = lambda v: v * sc
    s.append(f'<path d="M{hx-S(30):.1f},{hy-S(28):.1f} Q{hx-S(8):.1f},{hy-S(44):.1f} {hx+S(14):.1f},{hy-S(36):.1f}" fill="none" stroke="#fff" stroke-width="{S(4):.1f}" stroke-linecap="round" opacity=".6"/>')
    s.append(f'<circle cx="{hx:.1f}" cy="{hy+S(84):.1f}" r="{S(9):.1f}" fill="{P["gold"]}"/><circle cx="{hx:.1f}" cy="{hy+S(84):.1f}" r="{S(4):.1f}" fill="#B48CE0"/>')
    # --- mask on a stick (left of face)
    mx, my = 150, 318
    s.append(glow(f"{p}gold", mx, my - 20, 120))
    s.append(f'<path d="M{mx+6},{my+60} Q{mx+16},{my+110} 170,462" fill="none" stroke="#8A5A1C" stroke-width="9" stroke-linecap="round"/>'
             f'<path d="M{mx+6},{my+60} Q{mx+16},{my+110} 170,462" fill="none" stroke="#F8DC8B" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
    # fake halo ring on a little wire (gently bobbing)
    s.append(f'<path d="M{mx},{my-62} V{my-84}" stroke="#B9832A" stroke-width="3"/>')
    s.append(f'<g class="bob"><ellipse cx="{mx}" cy="{my-92}" rx="44" ry="12" fill="none" stroke="#FFE38A" stroke-width="7"/>'
             f'<ellipse cx="{mx}" cy="{my-92}" rx="44" ry="12" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></g>')
    s.append(f'<path d="M{mx-58},{my-30} C{mx-62},{my-70} {mx+62},{my-70} {mx+58},{my-30} C{mx+56},{my+20} {mx+30},{my+66} {mx},{my+68} '
             f'C{mx-30},{my+66} {mx-56},{my+20} {mx-58},{my-30}Z" fill="url(#{p}mask)" stroke="#B9832A" stroke-width="4"/>')
    s.append(f'<path d="M{mx-58},{my-30} q-26,-10 -30,-34 q16,10 30,6" fill="#F2C65A" stroke="#B9832A" stroke-width="3"/>'
             f'<path d="M{mx+58},{my-30} q26,-10 30,-34 q-16,10 -30,6" fill="#F2C65A" stroke="#B9832A" stroke-width="3"/>')
    s.append(f'<g fill="none" stroke="#7A4D16" stroke-width="5" stroke-linecap="round">'
             f'<path d="M{mx-36},{my-14} Q{mx-22},{my-28} {mx-8},{my-14}"/><path d="M{mx+8},{my-14} Q{mx+22},{my-28} {mx+36},{my-14}"/>'
             f'<path d="M{mx-24},{my+22} Q{mx},{my+46} {mx+24},{my+22}"/></g>')
    s.append(f'<circle cx="{mx-36}" cy="{my+10}" r="10" fill="#F28B82" opacity=".55"/><circle cx="{mx+36}" cy="{my+10}" r="10" fill="#F28B82" opacity=".55"/>')
    s.append(f'<path d="M{mx-30},{my-44} Q{mx-6},{my-56} {mx+18},{my-48}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>')
    s.append(sparkle_star(mx + 46, my - 50, 12, "#FFF8DC", "tw"))
    # --- golden oil lamp with a cold violet flame, resting on her palm
    lx, ly = 470, 512
    s.append(glow(f"{p}vio", lx + 44, ly - 50, 130))
    s.append(f'<path d="M{lx-62},{ly-10} C{lx-74},{ly-28} {lx-60},{ly-40} {lx-46},{ly-26}" fill="none" stroke="#B9832A" stroke-width="7" stroke-linecap="round"/>')
    s.append(f'<path d="M{lx-52},{ly-12} C{lx-50},{ly-34} {lx+10},{ly-38} {lx+34},{ly-26} L{lx+62},{ly-24} C{lx+72},{ly-22} {lx+72},{ly-8} {lx+62},{ly-8} '
             f'L{lx+32},{ly-4} C{lx+10},{ly+14} {lx-46},{ly+12} {lx-52},{ly-12}Z" fill="url(#{p}lamp)" stroke="#8A5A1C" stroke-width="3"/>')
    s.append(f'<ellipse cx="{lx-8}" cy="{ly-24}" rx="16" ry="5" fill="#5B3A1A"/>'
             f'<path d="M{lx-40},{ly-18} C{lx-30},{ly-30} {lx},{ly-32} {lx+20},{ly-26}" fill="none" stroke="#FFF0BE" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
             f'<circle cx="{lx-24}" cy="{ly-2}" r="4" fill="#B48CE0"/><circle cx="{lx}" cy="{ly+2}" r="4" fill="#B48CE0"/>')
    s.append(flame(lx + 62, ly - 20, 0.95, outer="#8D5BFF", mid="#C3A2FF", core="#F2EAFF"))
    s.append(hands)
    # lilac sparkles (4 animated, rest still)
    for (x, y, r, c) in [(80, 140, 14, "tw2"), (520, 380, 12, ""), (540, 130, 16, "tw3"),
                         (90, 520, 11, ""), (520, 620, 9, ""), (230, 610, 8, "")]:
        s.append(sparkle_star(x, y, r, P["lilac"] if r < 12 else "#E4D6F5", c))
    return p, "".join(s), defs


# ===================================================================== 양의 탈을 쓴 늑대
def mordred():
    p = "rmd_"
    d_sky, sky = bg(p, "#3A2550", "#9B5C8C", "#F4A46B")
    defs = d_sky
    defs += glow_def(f"{p}sun", "#FFD9A0", 0.8)
    defs += lin(f"{p}field", [(0, "#6E8A5A"), (1, "#36503E")])
    defs += rad(f"{p}wool", [(0, "#FFFFFF"), (0.75, "#F7F3FA"), (1, "#E4DCEC")], 0.45, 0.4, 0.6)
    defs += lin(f"{p}fur", [(0, "#A9A5B6"), (1, "#7A7688")])
    s = [sky]
    s.append(glow(f"{p}sun", 300, 470, 260))
    s.append(starfield(31, 14, 80, 70, 540, 190, color="#FFF1D6", twinkle=3, sparkles=2))
    s.append('<path d="M450,100 A30,30 0 1,0 450,160 A40,40 0 0,1 450,100Z" fill="#FFF1D6"/>')
    # Judean hills of the shepherd field
    s.append('<path d="M30,430 Q120,380 220,410 Q330,360 440,400 T570,390 V680 H30Z" fill="#8A6E8E" opacity=".75"/>')
    s.append(olive(96, 470, 0.7, "#4A3A48", "#5D6B58", "#7C8A70"))
    s.append(palm(540, 470, 130, 10, "#5A4A62", 0.85))
    s.append(f'<path d="M30,470 Q200,440 340,462 T570,452 V680 H30Z" fill="url(#{p}field)"/>')
    # dry-stone sheepfold wall
    s.append('<path d="M30,488 Q300,470 570,486 L570,532 Q300,516 30,534Z" fill="#6A5A62"/>')
    rnd = random.Random(7)
    st = []
    for row, (y0, dy) in enumerate([(498, 0), (514, 1)]):
        x = 30 - row * 14
        while x < 575:
            w = rnd.uniform(26, 40)
            yy = y0 - 18 * math.sin((x - 30) / 540 * math.pi) * 0.9
            st.append(f'<ellipse cx="{x+w/2:.1f}" cy="{yy:.1f}" rx="{w/2-1.5:.1f}" ry="9" fill="{rnd.choice(["#B8A89C", "#A8988E", "#C4B6A8"])}"/>')
            x += w
    s.append("".join(st))
    # puzzled little sheep (left, looking at the wolf) — gentle bob inside the helper
    s.append(f'<g transform="rotate(-8 112 556)">{sheep(104, 556, 0.62, face="#4A4458", cls="bob")}</g>')
    s.append('<path d="M134,523 l12,-6" stroke="#2A2333" stroke-width="3" stroke-linecap="round"/>'
             '<path d="M166,500 q6,10 0,14 q-6,-4 0,-14z" fill="#BFE3FF"/>')
    # ---------------- the wolf
    W = f"url(#{p}fur)"
    cx = 330
    s.append(f'<path d="M420,560 C500,560 540,500 520,440 C540,470 548,520 520,560 C552,540 560,500 556,480 C570,540 520,600 440,600Z" fill="{W}"/>'
             '<path d="M520,440 C530,455 536,470 538,488 C528,470 522,456 520,440Z" fill="#EDE8F2"/>')
    for fx in (cx - 60, cx + 60):
        s.append(f'<ellipse cx="{fx}" cy="660" rx="40" ry="22" fill="{W}"/>'
                 f'<g fill="#5B5768"><circle cx="{fx-18}" cy="672" r="5"/><circle cx="{fx}" cy="676" r="5"/><circle cx="{fx+18}" cy="672" r="5"/></g>')
    puffs = [(-120, 0, 58), (-90, -60, 60), (-30, -84, 62), (40, -86, 62), (100, -56, 60), (124, 4, 58),
             (104, 66, 56), (40, 92, 58), (-34, 94, 58), (-100, 64, 56), (0, 0, 100)]
    by0 = 540
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{cx+px}" cy="{by0+py}" r="{pr}"/>' for px, py, pr in puffs) + '</g>')
    s.append('<g fill="#D8CDE4" opacity=".35">' + "".join(
        f'<circle cx="{cx+px+10}" cy="{by0+py+12}" r="{pr*0.3:.0f}"/>' for px, py, pr in puffs[:-1]) + '</g>')
    s.append(f'<g fill="#B48CE0"><circle cx="{cx}" cy="{by0-20}" r="7"/><circle cx="{cx}" cy="{by0+16}" r="7"/><circle cx="{cx}" cy="{by0+52}" r="7"/></g>')
    for sgn in (-1, 1):
        ax_, ay_ = cx + sgn * 150, by0 + 30 - (6 if sgn > 0 else 0)
        s.append(f'<ellipse cx="{ax_}" cy="{ay_}" rx="30" ry="26" fill="{W}"/>'
                 f'<g fill="#5B5768"><circle cx="{ax_+sgn*18}" cy="{ay_+10}" r="4.5"/><circle cx="{ax_+sgn*6}" cy="{ay_+20}" r="4.5"/></g>')
    # head
    hx, hy = cx, 310
    hood = [(-110, -10, 46), (-96, -70, 46), (-50, -110, 48), (0, -122, 48), (50, -110, 48), (96, -70, 46),
            (110, -10, 46), (100, 50, 42), (-100, 50, 42), (0, -20, 112)]
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{hx+px}" cy="{hy+py}" r="{pr}"/>' for px, py, pr in hood) + '</g>')
    # floppy little sheep ears on the hood
    for sgn, rot in ((-1, -20), (1, 20)):
        ex_ = hx + sgn * 150
        s.append(f'<ellipse cx="{ex_}" cy="{hy-20}" rx="36" ry="16" transform="rotate({rot} {ex_} {hy-20})" fill="#4A4458"/>'
                 f'<ellipse cx="{ex_}" cy="{hy-20}" rx="22" ry="8" transform="rotate({rot} {ex_} {hy-20})" fill="#E7A9B8"/>')
    # pointy wolf ears poking THROUGH the hood (drawn on top, with wool tufts at the base)
    for sgn in (-1, 1):
        bx = hx + sgn * 58
        s.append(f'<path d="M{bx-sgn*30},{hy-96} L{bx+sgn*20},{hy-196} L{bx+sgn*42},{hy-88}Z" fill="{W}"/>'
                 f'<path d="M{bx-sgn*14},{hy-100} L{bx+sgn*18},{hy-166} L{bx+sgn*28},{hy-98}Z" fill="#E7A9B8"/>')
        s.append(f'<g fill="url(#{p}wool)"><circle cx="{bx-sgn*24}" cy="{hy-94}" r="20"/><circle cx="{bx+sgn*4}" cy="{hy-86}" r="22"/>'
                 f'<circle cx="{bx+sgn*34}" cy="{hy-84}" r="18"/></g>')
    # wolf face in the hood opening
    s.append(f'<ellipse cx="{hx}" cy="{hy+8}" rx="84" ry="80" fill="{W}"/>')
    s.append(f'<path d="M{hx-84},{hy+20} Q{hx-60},{hy+70} {hx-20},{hy+86} L{hx-40},{hy+40}Z M{hx+84},{hy+20} Q{hx+60},{hy+70} {hx+20},{hy+86} L{hx+40},{hy+40}Z" fill="#E9E4EE"/>')
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{hx+px}" cy="{hy+py}" r="{pr}"/>' for px, py, pr in
        [(-70, -54, 28), (-36, -70, 30), (0, -76, 30), (36, -70, 30), (70, -54, 28), (-88, -18, 22), (88, -18, 22)]) + '</g>')
    s.append(f'<ellipse cx="{hx}" cy="{hy+48}" rx="52" ry="38" fill="#ECE7F0"/>')
    s.append(f'<path d="M{hx-20},{hy+22} Q{hx},{hy+12} {hx+20},{hy+22} Q{hx+14},{hy+38} {hx},{hy+40} Q{hx-14},{hy+38} {hx-20},{hy+22}Z" fill="#2E2A38"/>'
             f'<ellipse cx="{hx-6}" cy="{hy+22}" rx="6" ry="3" fill="#fff" opacity=".6"/>')
    s.append(f'<path d="M{hx-36},{hy+54} Q{hx-10},{hy+82} {hx+40},{hy+48}" fill="none" stroke="#2E2A38" stroke-width="5" stroke-linecap="round"/>'
             f'<path d="M{hx},{hy+40} V{hy+60}" stroke="#2E2A38" stroke-width="4" stroke-linecap="round"/>'
             f'<path d="M{hx+12},{hy+67} L{hx+18},{hy+80} L{hx+24},{hy+63}Z" fill="#fff" stroke="#2E2A38" stroke-width="1.5" stroke-linejoin="round"/>')
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 34, hy - 8
        s.append(f'<ellipse cx="{ex}" cy="{ey}" rx="21" ry="16" fill="#FFC94D"/>'
                 f'<circle cx="{ex+sgn*4-6}" cy="{ey+4}" r="8" fill="#2E2A38"/>'
                 f'<circle cx="{ex+sgn*4-9}" cy="{ey+1}" r="2.6" fill="#fff"/>'
                 f'<path d="M{ex-24},{ey-1} Q{ex},{ey-22} {ex+24},{ey-1} L{ex+24},{ey-20} L{ex-24},{ey-20}Z" fill="#8F8B9C"/>'
                 f'<path d="M{ex-24},{ey-1} Q{ex},{ey-8} {ex+24},{ey-1}" fill="none" stroke="#2E2A38" stroke-width="4.5" stroke-linecap="round"/>')
    s.append(f'<path d="M{hx-58},{hy-38} L{hx-16},{hy-28} M{hx+16},{hy-28} L{hx+58},{hy-40}" stroke="#5B5768" stroke-width="7" stroke-linecap="round"/>')
    s.append(f'<circle cx="{hx-58}" cy="{hy+30}" r="11" fill="#F28B82" opacity=".45"/><circle cx="{hx+58}" cy="{hy+30}" r="11" fill="#F28B82" opacity=".45"/>')
    s.append(sparkle_star(160, 300, 14, "#FFF1D6", "tw"))
    s.append(sparkle_star(515, 300, 10, "#FFF1D6", "tw2"))
    s.append('<g fill="#2B4636">' + "".join(
        f'<path d="M{x},680 Q{x+5},{652-(x*5)%22} {x+10},680Z"/>' for x in range(30, 570, 18)) + '</g>')
    return p, "".join(s), defs


# ===================================================================== 방황하는 자
def oberon():
    p = "rob_"
    d_sky, sky = bg(p, "#141B33", "#2C3E6B", "#8794B8")
    defs = d_sky
    defs += lin(f"{p}path", [(0, "#E6E1D2", 0.95), (1, "#B8B2A4", 0.75)])
    defs += rad(f"{p}fog", [(0, "#D3DBEE", 0.7), (0.6, "#D3DBEE", 0.35), (1, "#D3DBEE", 0)])
    defs += glow_def(f"{p}hz", "#D7E0F5", 0.6)
    defs += glow_def(f"{p}moon", "#E9EEFA", 0.5)
    s = [sky]
    s.append(starfield(41, 30, 70, 70, 540, 290, color="#E9EEFA", twinkle=3, sparkles=2, avoid=(150, 150, 50)))
    s.append(glow(f"{p}moon", 150, 150, 70, cls=""))
    s.append('<path d="M150,124 A26,26 0 1,0 150,176 A34,34 0 0,1 150,124Z" fill="#E9EEFA"/>')
    s.append(glow(f"{p}hz", 330, 380, 170))
    # desert mesas and dunes, cool night tones
    s.append('<path d="M30,380 L70,380 L84,350 L170,350 L186,384 L300,380 Q340,340 380,372 L430,370 L446,330 L520,330 L536,372 L570,374 V680 H30Z" fill="#6A6E98"/>')
    s.append(fog_band(f"{p}fog", 300, 380, 300, 26, -4))
    s.append('<path d="M30,440 Q120,400 220,432 Q320,396 420,430 T570,420 V680 H30Z" fill="#4C5383"/>')
    s.append(palm(480, 436, 70, 8, "#3A4070", 0.55) + palm(505, 436, 56, -6, "#3A4070", 0.45))
    s.append('<path d="M30,500 Q160,462 290,490 Q420,456 570,486 V680 H30Z" fill="#383F6C"/>')
    s.append(fog_band(f"{p}fog", 220, 486, 260, 22, -9))
    s.append('<path d="M30,580 Q190,546 330,572 T570,560 V680 H30Z" fill="#262E55"/>')
    # winding pale path to the horizon
    s.append(f'<path d="M210,680 C260,620 420,610 380,560 C350,520 250,520 300,488 C330,468 360,462 352,446 '
             f'L360,446 C374,462 350,476 322,490 C282,516 386,524 420,560 C470,612 360,640 400,680Z" fill="url(#{p}path)" opacity=".85"/>')
    # signpost with blank boards (left foreground)
    sx = 120
    s.append(f'<rect x="{sx-8}" y="470" width="16" height="210" rx="5" fill="#6B5446"/>')
    s.append(f'<path d="M{sx-6},492 H{sx+86} L{sx+104},510 L{sx+86},528 H{sx-6}Z" fill="#A6836A"/>')
    s.append(f'<path d="M{sx+6},540 H{sx-70} L{sx-88},558 L{sx-70},576 H{sx+6}Z" fill="#94735C"/>')
    s.append(f'<g transform="rotate(-18 {sx} 600)"><path d="M{sx-4},590 H{sx+70} L{sx+86},604 L{sx+70},618 H{sx-4}Z" fill="#8A6A55"/></g>')
    s.append(f'<path d="M{sx},482 l-7,-14 h14z" fill="#6B5446"/>')
    s.append(f'<g stroke="#5A4538" stroke-width="2" opacity=".5"><path d="M{sx+4},504 H{sx+80}"/><path d="M{sx-4},552 H{sx-66}"/></g>')
    # desert stones & dry shrub
    s.append('<g fill="#1E2546"><ellipse cx="480" cy="640" rx="40" ry="16"/><ellipse cx="520" cy="630" rx="22" ry="12"/></g>')
    s.append('<path d="M250,640 l-14,-22 M250,640 l0,-28 M250,640 l14,-22 M250,640 l-24,-10 M250,640 l24,-12" stroke="#3B3A5C" stroke-width="3" stroke-linecap="round"/>')
    # the lone wanderer, seen from behind
    sc = 0.7
    cx, by = 350, 600
    robe, robe2 = "#3C4674", "#2A3258"
    body, hands, _ = figure(cx, by, sc, robe, robe2, P["skin2"], "#3B2A22", back=True,
                            arms=[("L", cx - 58, by - 104), ("R", cx + 56, by - 112)], hood_col="#4A5584")
    s.append(f'<ellipse cx="{cx}" cy="{by+6}" rx="70" ry="10" fill="#000" opacity=".2"/>')
    s.append(f'<path d="M{cx-54},{by-170} L{cx-74},{by+8}" stroke="#7A5C46" stroke-width="8" stroke-linecap="round"/>')
    s.append(body)
    # unlit lantern hanging from the right hand
    lx, ly = cx + 60, by - 112
    s.append(f'<path d="M{lx},{ly} V{ly+14}" stroke="#3A3F55" stroke-width="3"/>'
             f'<path d="M{lx-15},{ly+14} H{lx+15} L{lx+11},{ly+7} H{lx-11}Z" fill="#4A4F66"/>'
             f'<rect x="{lx-13}" y="{ly+14}" width="26" height="34" rx="4" fill="#2C3450" stroke="#4A4F66" stroke-width="3"/>'
             f'<path d="M{lx},{ly+16} V{ly+46}" stroke="#4A4F66" stroke-width="2"/>'
             f'<path d="M{lx-6},{ly+40} h12" stroke="#6B7290" stroke-width="3" stroke-linecap="round"/>'
             f'<path d="M{lx-16},{ly+48} H{lx+16} L{lx+12},{ly+54} H{lx-12}Z" fill="#4A4F66"/>')
    s.append(hands)
    s.append(fog_band(f"{p}fog", 300, 640, 340, 34, -2))
    return p, "".join(s), defs


# ===================================================================== 유혹하는 자
def minion():
    p = "rmi_"
    d_sky, sky = bg(p, "#2A1844", "#7E4F8C", "#F28B6B")
    defs = d_sky
    defs += ('<linearGradient id="rmi_snake" gradientUnits="userSpaceOnUse" x1="180" y1="300" x2="420" y2="560">'
             '<stop offset="0" stop-color="#5FBF6A"/><stop offset="0.55" stop-color="#4FA078"/><stop offset="1" stop-color="#8A5BC4"/></linearGradient>')
    defs += ('<linearGradient id="rmi_head" gradientUnits="userSpaceOnUse" x1="300" y1="390" x2="340" y2="540">'
             '<stop offset="0" stop-color="#7DCB74"/><stop offset="0.6" stop-color="#6FAE86"/><stop offset="1" stop-color="#9A72CE"/></linearGradient>')
    defs += rad(f"{p}apple", [(0, "#FF8A7A"), (0.55, "#E23B3B"), (1, "#A61E30")], 0.38, 0.35, 0.65)
    defs += glow_def(f"{p}ag", "#FFB39A", 0.7)
    defs += glow_def(f"{p}sun", "#FFD9A0", 0.7)
    defs += lin(f"{p}bark", [(0, "#7A5340"), (1, "#4E3326")], 0, 0, 1, 0)
    defs += lin(f"{p}river", [(0, "#9FD3F2"), (1, "#5E9ECF")])
    s = [sky]
    s.append(glow(f"{p}sun", 420, 520, 220, cls=""))
    s.append(starfield(51, 8, 300, 230, 540, 300, color="#FFE9D6", twinkle=1, sparkles=1))
    # Eden: palms, river, flowers
    s.append(palm(470, 540, 190, 16, "#4A3A5C", 1.0))
    s.append(palm(540, 540, 150, -10, "#4A3A5C", 0.85))
    s.append('<path d="M30,560 Q200,520 330,550 T570,540 V680 H30Z" fill="#3C5A4E"/>')
    s.append(f'<path d="M570,556 C480,566 420,590 380,620 C350,644 400,670 470,680 L570,680Z" fill="url(#{p}river)" opacity=".9"/>')
    s.append('<path d="M500,600 h30 M450,630 h40 M470,660 h30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>')
    s.append(sparkle_star(512, 612, 9, "#FFFFFF", "tw2"))
    s.append('<path d="M30,630 Q200,600 340,622 Q380,640 370,680 H30Z" fill="#2F4A40"/>')
    for (x, y, r) in [(330, 590, 34), (370, 600, 26)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#355246"/>')
    for (x, y, c) in [(320, 572, "#F6B6D0"), (350, 586, "#FFE38A"), (60, 640, "#F6B6D0"), (95, 650, "#B48CE0"),
                      (300, 650, "#FFE38A"), (340, 660, "#F6B6D0"), (276, 664, "#B48CE0")]:
        s.append(f'<g fill="{c}"><circle cx="{x-4}" cy="{y}" r="4.5"/><circle cx="{x+4}" cy="{y}" r="4.5"/>'
                 f'<circle cx="{x}" cy="{y-4}" r="4.5"/><circle cx="{x}" cy="{y+4}" r="4.5"/></g><circle cx="{x}" cy="{y}" r="2.6" fill="#FFF6E5"/>')
    # trunk + canopy (canopy keeps the top corners leafy, nothing important there)
    s.append(f'<path d="M70,680 C90,560 80,420 100,300 L150,290 C150,420 150,560 170,680Z" fill="url(#{p}bark)"/>')
    leaves = [(40, 80, 80), (130, 50, 90), (240, 40, 90), (350, 45, 90), (460, 55, 90), (560, 90, 80),
              (80, 180, 80), (200, 150, 80), (330, 150, 80), (460, 160, 80), (560, 200, 70), (120, 250, 60), (520, 250, 50)]
    s.append('<g fill="#2F5D50">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in leaves) + '</g>')
    s.append('<g fill="#4F8A6E" opacity=".75">' + "".join(
        f'<circle cx="{x-14}" cy="{y-16}" r="{r*0.62:.0f}"/>' for x, y, r in leaves) + '</g>')
    for (x, y, r) in [(110, 120, 15), (190, 90, 14), (300, 120, 16), (410, 100, 14), (500, 140, 15), (150, 210, 13),
                      (260, 200, 14), (380, 214, 15), (520, 230, 12), (66, 236, 12)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{p}apple)"/>'
                 f'<circle cx="{x-r*0.35:.1f}" cy="{y-r*0.35:.1f}" r="{r*0.25:.1f}" fill="#fff" opacity=".7"/>'
                 f'<path d="M{x},{y-r} q2,-7 6,-9" stroke="#4E3326" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    # branch
    s.append(f'<path d="M110,330 C220,300 360,300 560,318 L560,350 C380,334 230,340 130,368Z" fill="url(#{p}bark)"/>')
    s.append('<g fill="#4F8A6E"><ellipse cx="545" cy="312" rx="22" ry="10" transform="rotate(-20 545 312)"/>'
             '<ellipse cx="500" cy="312" rx="18" ry="8" transform="rotate(-30 500 312)"/></g>')
    # --- serpent: a real helix around the branch
    SN = "url(#rmi_snake)"
    yc, R, x0, pitch = 326, 30, 205, 76

    def hel(t):
        return x0 + pitch * t / (2 * math.pi), yc + R * math.cos(t), math.sin(t)

    def poly(t0, t1, n=24):
        pts = [hel(t0 + (t1 - t0) * i / n) for i in range(n + 1)]
        return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y, _ in pts)
    tx0, ty0, _ = hel(0)
    tail = f"M{tx0:.1f},{ty0:.1f} C170,400 160,470 205,520 C240,556 262,590 246,626"
    s.append(f'<path d="{tail}" fill="none" stroke="{SN}" stroke-width="32" stroke-linecap="round"/>')
    s.append(f'<path d="{tail}" fill="none" stroke="#D9F0B0" stroke-width="9" stroke-linecap="round" opacity=".6" transform="translate(7,3)"/>')
    # whole helix in shade (back parts), then branch front, then front crossings
    s.append(f'<path d="{poly(0, 5*math.pi, 120)}" fill="none" stroke="#3E7A5E" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>')
    s.append(f'<path d="M180,318 C260,306 330,304 430,308 L430,344 C330,338 260,340 180,352Z" fill="url(#{p}bark)"/>')
    s.append('<path d="M150,338 C240,318 360,318 540,328" fill="none" stroke="#9A7058" stroke-width="5" stroke-linecap="round" opacity=".55"/>')
    for k in range(3):
        a, b = 2 * math.pi * k, 2 * math.pi * k + math.pi
        d = poly(a, b)
        s.append(f'<path d="{d}" fill="none" stroke="{SN}" stroke-width="34" stroke-linecap="round"/>'
                 f'<path d="{d}" fill="none" stroke="#D9F0B0" stroke-width="9" stroke-linecap="round" opacity=".55" transform="translate(-6,0)"/>')
    ex_, ey_, _ = hel(5 * math.pi)
    neck = f"M{ex_:.1f},{ey_:.1f} C470,286 490,380 440,422 C420,440 400,446 380,452"
    s.append(f'<path d="{neck}" fill="none" stroke="{SN}" stroke-width="42" stroke-linecap="round"/>')
    s.append(f'<path d="{neck}" fill="none" stroke="#D9F0B0" stroke-width="12" stroke-linecap="round" opacity=".55" transform="translate(-8,6)"/>')
    s.append('<g fill="#B48CE0" opacity=".75"><circle cx="462" cy="350" r="6"/><circle cx="456" cy="392" r="5"/>'
             '<circle cx="180" cy="430" r="5"/><circle cx="186" cy="478" r="6"/><circle cx="232" cy="552" r="5"/></g>')
    # head (bobs gently)
    hx, hy = 330, 470
    hd = []
    hd.append(f'<path d="M{hx-92},{hy+4} C{hx-96},{hy-60} {hx-40},{hy-82} {hx+6},{hy-80} C{hx+70},{hy-78} {hx+104},{hy-40} {hx+96},{hy+10} '
              f'C{hx+90},{hy+52} {hx+40},{hy+70} {hx},{hy+68} C{hx-50},{hy+68} {hx-88},{hy+44} {hx-92},{hy+4}Z" fill="url(#rmi_head)"/>')
    hd.append(f'<path d="M{hx-60},{hy+30} C{hx-30},{hy+56} {hx+40},{hy+58} {hx+70},{hy+30} C{hx+50},{hy+64} {hx-40},{hy+66} {hx-60},{hy+30}Z" fill="#D9F0B0" opacity=".55"/>')
    hd.append(f'<ellipse cx="{hx-30}" cy="{hy-58}" rx="34" ry="10" fill="#fff" opacity=".22"/>')
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 40, hy - 18
        hd.append(f'<ellipse cx="{ex}" cy="{ey}" rx="30" ry="27" fill="#fff"/>'
                  f'<ellipse cx="{ex-10}" cy="{ey+6}" rx="13" ry="16" fill="#3A2550"/>'
                  f'<circle cx="{ex-14}" cy="{ey+1}" r="4.5" fill="#fff"/>'
                  f'<path d="M{ex-33},{ey+2} Q{ex},{ey-12} {ex+33},{ey+2} L{ex+33},{ey-32} L{ex-33},{ey-32}Z" fill="#62AE6E"/>'
                  f'<path d="M{ex-33},{ey+2} Q{ex},{ey-12} {ex+33},{ey+2}" fill="none" stroke="#2A3A2E" stroke-width="5" stroke-linecap="round"/>'
                  f'<path d="M{ex+sgn*18},{ey+1} l{sgn*14},-6" stroke="#2A3A2E" stroke-width="3.5" stroke-linecap="round"/>')
    hd.append(f'<path d="M{hx-50},{hy-56} L{hx-14},{hy-46} M{hx+14},{hy-46} L{hx+50},{hy-60}" stroke="#2F5D50" stroke-width="6" stroke-linecap="round"/>')
    hd.append(f'<circle cx="{hx-10}" cy="{hy+22}" r="3" fill="#2A3A2E"/><circle cx="{hx+12}" cy="{hy+22}" r="3" fill="#2A3A2E"/>')
    hd.append(f'<path d="M{hx-36},{hy+36} Q{hx},{hy+50} {hx+38},{hy+32} Q{hx+48},{hy+26} {hx+52},{hy+18}" fill="none" stroke="#2A3A2E" stroke-width="5" stroke-linecap="round"/>')
    hd.append(f'<path d="M{hx+4},{hy+44} Q{hx+2},{hy+62} {hx-4},{hy+72} M{hx+2},{hy+60} Q{hx+8},{hy+70} {hx+12},{hy+74}" fill="none" stroke="#F58AB0" stroke-width="5" stroke-linecap="round"/>')
    hd.append(f'<circle cx="{hx-66}" cy="{hy+14}" r="12" fill="#F28B82" opacity=".45"/><circle cx="{hx+68}" cy="{hy+12}" r="12" fill="#F28B82" opacity=".45"/>')
    s.append(f'<g class="bob">{"".join(hd)}</g>')
    # offered apple, held in the tail tip
    ax, ay = 176, 606
    s.append(glow(f"{p}ag", ax, ay - 6, 110))
    s.append(f'<path d="M{ax},{ay-46} C{ax-24},{ay-62} {ax-60},{ay-50} {ax-58},{ay-6} C{ax-56},{ay+36} {ax-24},{ay+56} {ax},{ay+44} '
             f'C{ax+24},{ay+56} {ax+56},{ay+36} {ax+58},{ay-6} C{ax+60},{ay-50} {ax+24},{ay-62} {ax},{ay-46}Z" fill="url(#{p}apple)"/>')
    s.append(f'<path d="M{ax},{ay-44} q4,-20 14,-26" stroke="#4E3326" stroke-width="6" fill="none" stroke-linecap="round"/>'
             f'<path d="M{ax+8},{ay-58} q24,-18 40,-4 q-20,14 -40,4z" fill="#7FB07A"/>'
             f'<ellipse cx="{ax-26}" cy="{ay-20}" rx="10" ry="16" transform="rotate(25 {ax-26} {ay-20})" fill="#fff" opacity=".75"/>'
             f'<circle cx="{ax-30}" cy="{ay+8}" r="5" fill="#fff" opacity=".5"/>')
    # tail tip curling round the front of the apple
    tip = "M246,626 C236,656 196,664 160,652 C134,642 124,622 136,606"
    s.append(f'<path d="{tip}" fill="none" stroke="#7E5FB8" stroke-width="22" stroke-linecap="round"/>'
             f'<path d="{tip}" fill="none" stroke="#E4D6F5" stroke-width="6" stroke-linecap="round" opacity=".6" transform="translate(0,-5)"/>')
    s.append(sparkle_star(ax + 52, ay - 52, 18, "#FFF3D6", "tw"))
    s.append(sparkle_star(ax - 66, ay - 54, 10, "#FFF3D6", "tw3"))
    s.append(sparkle_star(ax + 74, ay + 4, 8, "#FFF3D6", ""))
    s.append(sparkle_star(470, 460, 12, "#FFE3B0", "tw2"))
    return p, "".join(s), defs


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("assassin", assassin), ("morgana", morgana), ("mordred", mordred),
                     ("oberon", oberon), ("minion", minion)]:
        p, scene, defs = fn()
        path = os.path.join(OUT, f"{name}.svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(card(p, "evil", scene, defs))
        print(f"{path}  {os.path.getsize(path)/1024:.1f} KB")


if __name__ == "__main__":
    main()
