"""Build the journey map shown between missions (사명) + its marker and stop badges.

Run from this directory:  python3 build_map.py
Writes into <assets>/map/ :
  journey.svg          illuminated parchment map, road path id="mp_route", pads id="mp_stop1..5"
  route.json           route d string, start, stop centres and their length fractions t
  marker.svg           travelling lamp-bearer (anchor = bottom-centre 50,92)
  stop-done-good.svg   gold wax seal for a completed (success) stop
  stop-done-evil.svg   plum wax seal for a completed (fail) stop
  stop-current.svg     pulsing golden halo for the current destination
"""
import json
import math
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ASSETS = os.path.dirname(HERE)

from lib import P, svg, lin, rad, glow_def, sparkle_star, rays, dove, sheep, flame  # noqa: E402

W, H = 600, 1300
PAD_R = 46
MARKER_SIZE = 90

START = (300, 1222)
STOPS = [(185, 1040), (420, 845), (195, 640), (415, 432), (300, 236)]


def write(rel, text):
    path = os.path.join(ASSETS, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    n = len(re.findall(r'class="(?:tw|tw2|tw3|fl|glow|drift|bob|spin|[a-z]{2}_[a-z]+)"', text))
    print(f"{rel:24s} {len(text.encode()) / 1024:6.1f} KB  anim={n}")


def style(css):
    return f"<style>{css}</style>"


# ------------------------------------------------------------ bezier maths
def cubic(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


def seg_len(seg, n=600):
    L, prev = 0.0, seg[0]
    for i in range(1, n + 1):
        q = cubic(*seg, i / n)
        L += math.hypot(q[0] - prev[0], q[1] - prev[1])
        prev = q
    return L


def f1(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def build_route():
    """Winding road: vertical tangents at every stop give soft S-bends; a couple of
    extra bends (waypoints) make it wander like a pilgrim road."""
    pts = [START, STOPS[0], STOPS[1], STOPS[2], STOPS[3], STOPS[4]]
    segs = []
    for a, b in zip(pts, pts[1:]):
        h = (a[1] - b[1]) * 0.55
        segs.append((a, (a[0], a[1] - h), (b[0], b[1] + h), b))
    # round control points the same way they are written, so lengths match the d string exactly
    segs = [tuple((float(f1(x)), float(f1(y))) for x, y in s) for s in segs]
    d = f"M{f1(segs[0][0][0])},{f1(segs[0][0][1])}" + "".join(
        f" C{f1(s[1][0])},{f1(s[1][1])} {f1(s[2][0])},{f1(s[2][1])} {f1(s[3][0])},{f1(s[3][1])}" for s in segs)
    lens = [seg_len(s) for s in segs]
    total = sum(lens)
    ts, acc = [], 0.0
    for L in lens:
        acc += L
        ts.append(acc / total)
    return d, segs, ts, total


def sample_route(segs, n=120):
    out = []
    for s in segs:
        for i in range(n):
            out.append(cubic(*s, i / n))
    out.append(segs[-1][3])
    return out


# ------------------------------------------------------------ small drawings
def olive_tree(x, y, s, cls=""):
    """Small olive tree, (x, y) = foot of trunk."""
    S = lambda v: v * s
    trunk = (f'<path d="M{x-S(5):.1f},{y:.1f} C{x-S(3):.1f},{y-S(16):.1f} {x-S(12):.1f},{y-S(22):.1f} {x-S(8):.1f},{y-S(34):.1f} '
             f'L{x-S(2):.1f},{y-S(34):.1f} C{x:.1f},{y-S(26):.1f} {x+S(4):.1f},{y-S(30):.1f} {x+S(8):.1f},{y-S(36):.1f} '
             f'L{x+S(12):.1f},{y-S(33):.1f} C{x+S(6):.1f},{y-S(24):.1f} {x+S(4):.1f},{y-S(14):.1f} {x+S(6):.1f},{y:.1f}Z" fill="#7A5A3A"/>')
    blobs = [(-16, -44, 17, 12), (2, -52, 20, 14), (19, -44, 16, 11), (-26, -36, 11, 8), (28, -36, 11, 8), (0, -38, 18, 10)]
    c = "".join(f'<ellipse cx="{x+S(bx):.1f}" cy="{y+S(by):.1f}" rx="{S(rx):.1f}" ry="{S(ry):.1f}"/>' for bx, by, rx, ry in blobs)
    hi = "".join(f'<ellipse cx="{x+S(bx):.1f}" cy="{y+S(by-4):.1f}" rx="{S(rx*0.6):.1f}" ry="{S(ry*0.45):.1f}"/>' for bx, by, rx, ry in blobs[:3])
    dots = "".join(f'<circle cx="{x+S(dx):.1f}" cy="{y+S(dy):.1f}" r="{S(1.8):.1f}"/>' for dx, dy in [(-18, -40), (8, -46), (22, -40), (-4, -36)])
    return (f'<ellipse cx="{x:.1f}" cy="{y+S(1):.1f}" rx="{S(24):.1f}" ry="{S(5):.1f}" fill="#6B4A26" opacity=".18"/>'
            f'{trunk}<g fill="#7E9A5E">{c}</g><g fill="#A9BF83">{hi}</g><g fill="#3F5A2A">{dots}</g>')


def cypress(x, y, s):
    S = lambda v: v * s
    return (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{S(10):.1f}" ry="{S(3):.1f}" fill="#6B4A26" opacity=".18"/>'
            f'<path d="M{x:.1f},{y-S(62):.1f} C{x+S(10):.1f},{y-S(44):.1f} {x+S(11):.1f},{y-S(14):.1f} {x+S(3):.1f},{y:.1f} '
            f'L{x-S(3):.1f},{y:.1f} C{x-S(11):.1f},{y-S(14):.1f} {x-S(10):.1f},{y-S(44):.1f} {x:.1f},{y-S(62):.1f}Z" fill="#4F7A55"/>'
            f'<path d="M{x:.1f},{y-S(58):.1f} C{x-S(7):.1f},{y-S(40):.1f} {x-S(8):.1f},{y-S(16):.1f} {x-S(2):.1f},{y-S(3):.1f} '
            f'C{x-S(3):.1f},{y-S(20):.1f} {x-S(3):.1f},{y-S(40):.1f} {x:.1f},{y-S(58):.1f}Z" fill="#7FA97A" opacity=".7"/>')


def palm(x, y, s):
    S = lambda v: v * s
    trunk = (f'<path d="M{x-S(3):.1f},{y:.1f} Q{x+S(3):.1f},{y-S(36):.1f} {x+S(10):.1f},{y-S(70):.1f} '
             f'L{x+S(14):.1f},{y-S(69):.1f} Q{x+S(8):.1f},{y-S(36):.1f} {x+S(4):.1f},{y:.1f}Z" fill="#9A6E44"/>')
    tx, ty = x + S(12), y - S(70)
    fr = []
    for ang, ln in [(-165, 34), (-130, 30), (-92, 22), (-50, 30), (-15, 34), (15, 28), (165, 28)]:
        a = math.radians(ang)
        ex, ey = tx + S(ln) * math.cos(a), ty + S(ln) * math.sin(a) + S(10)
        mx, my = tx + S(ln * 0.5) * math.cos(a), ty + S(ln * 0.5) * math.sin(a) - S(4)
        fr.append(f'M{tx:.1f},{ty:.1f} Q{mx:.1f},{my - S(4):.1f} {ex:.1f},{ey:.1f} Q{mx:.1f},{my + S(3):.1f} {tx:.1f},{ty:.1f}Z')
    return (f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{S(14):.1f}" ry="{S(3):.1f}" fill="#6B4A26" opacity=".18"/>'
            + trunk + f'<path d="{" ".join(fr)}" fill="#6E9A5A"/>')


def house(x, y, w, h, dome=False):
    """Flat-roofed stone house. (x, y) = bottom-left."""
    top = y - h
    o = (f'<rect x="{x+3}" y="{top+4}" width="{w}" height="{h}" fill="#6B4A26" opacity=".18"/>'
         f'<rect x="{x}" y="{top}" width="{w}" height="{h}" fill="#F2DDB4"/>'
         f'<rect x="{x + w * 0.7:.1f}" y="{top}" width="{w * 0.3:.1f}" height="{h}" fill="#DDBF8C"/>'
         f'<rect x="{x-2}" y="{top-4}" width="{w+4}" height="5" rx="2" fill="#C99A62"/>'
         f'<path d="M{x + w * 0.28:.1f},{y} v-{h * 0.42:.1f} a{w * 0.1:.1f},{w * 0.1:.1f} 0 0 1 {w * 0.2:.1f},0 v{h * 0.42:.1f}z" fill="#8A5A34"/>'
         f'<path d="M{x + w * 0.56:.1f},{top + h * 0.38:.1f} v-5 a3,3 0 0 1 6,0 v5z" fill="#8A5A34"/>')
    if dome:
        r = w * 0.3
        o += f'<path d="M{x + w * 0.5 - r:.1f},{top-3} A{r:.1f},{r:.1f} 0 0 1 {x + w * 0.5 + r:.1f},{top-3}Z" fill="#E9C27A"/>'
    return o


def tent(x, y, s, c1, c2):
    """Bedouin-style tent with two poles, (x, y) = bottom centre."""
    S = lambda v: v * s
    roof = (f'M{x-S(48):.1f},{y:.1f} L{x-S(36):.1f},{y-S(36):.1f} L{x-S(16):.1f},{y-S(28):.1f} L{x:.1f},{y-S(48):.1f} '
            f'L{x+S(16):.1f},{y-S(28):.1f} L{x+S(36):.1f},{y-S(36):.1f} L{x+S(48):.1f},{y:.1f}Z')
    stripes = (f'M{x-S(42):.1f},{y-S(18):.1f} L{x-S(36):.1f},{y-S(30):.1f} L{x-S(16):.1f},{y-S(22):.1f} L{x:.1f},{y-S(40):.1f} '
               f'L{x+S(16):.1f},{y-S(22):.1f} L{x+S(36):.1f},{y-S(30):.1f} L{x+S(42):.1f},{y-S(18):.1f} '
               f'L{x+S(43):.1f},{y-S(12):.1f} L{x+S(36):.1f},{y-S(24):.1f} L{x+S(16):.1f},{y-S(16):.1f} L{x:.1f},{y-S(34):.1f} '
               f'L{x-S(16):.1f},{y-S(16):.1f} L{x-S(36):.1f},{y-S(24):.1f} L{x-S(43):.1f},{y-S(12):.1f}Z')
    return (f'<ellipse cx="{x+S(4):.1f}" cy="{y+S(2):.1f}" rx="{S(52):.1f}" ry="{S(7):.1f}" fill="#6B4A26" opacity=".2"/>'
            f'<path d="{roof}" fill="{c1}"/><path d="{stripes}" fill="{c2}"/>'
            f'<path d="M{x:.1f},{y-S(48):.1f} L{x+S(16):.1f},{y-S(28):.1f} L{x+S(36):.1f},{y-S(36):.1f} L{x+S(48):.1f},{y:.1f} L{x+S(12):.1f},{y:.1f}Z" fill="#000" opacity=".1"/>'
            f'<path d="M{x-S(11):.1f},{y:.1f} L{x:.1f},{y-S(30):.1f} L{x+S(11):.1f},{y:.1f}Z" fill="#5A3A22"/>'
            f'<path d="M{x:.1f},{y-S(30):.1f} L{x+S(11):.1f},{y:.1f} L{x+S(18):.1f},{y:.1f}Z" fill="{c1}" opacity=".9"/>'
            f'<path d="M{x:.1f},{y-S(48):.1f} V{y-S(60):.1f}" stroke="#7A5A3A" stroke-width="{S(2.5):.1f}" stroke-linecap="round"/>'
            f'<path d="M{x:.1f},{y-S(60):.1f} l{S(11):.1f},{S(3):.1f} l-{S(11):.1f},{S(3):.1f}z" fill="#E9B949"/>')


def boat(x, y, s):
    S = lambda v: v * s
    return (f'<path d="M{x-S(26):.1f},{y-S(6):.1f} Q{x:.1f},{y+S(10):.1f} {x+S(26):.1f},{y-S(6):.1f} Q{x:.1f},{y+S(2):.1f} {x-S(26):.1f},{y-S(6):.1f}Z" fill="#9A6E44"/>'
            f'<path d="M{x-S(22):.1f},{y-S(4):.1f} Q{x:.1f},{y+S(6):.1f} {x+S(22):.1f},{y-S(4):.1f}" fill="none" stroke="#C99A62" stroke-width="{S(1.6):.1f}"/>'
            f'<path d="M{x:.1f},{y-S(4):.1f} V{y-S(34):.1f}" stroke="#7A5232" stroke-width="{S(2):.1f}"/>'
            f'<path d="M{x+S(2):.1f},{y-S(32):.1f} Q{x+S(18):.1f},{y-S(20):.1f} {x+S(2):.1f},{y-S(8):.1f}Z" fill="#FFF8E6"/>')


def well(p, x, y, s):
    """Stone well with a little wooden roof. (x, y) = bottom centre. Water shimmer = 1 anim."""
    S = lambda v: v * s
    stones = []
    for row in range(3):
        yy = y - S(8) - row * S(9)
        off = 0 if row % 2 == 0 else S(7)
        for k in range(-2, 3):
            stones.append(f'<rect x="{x + k * S(14) - S(6) + off:.1f}" y="{yy - S(4):.1f}" width="{S(12):.1f}" height="{S(7):.1f}" rx="{S(2.5):.1f}"/>')
    return (
        f'<ellipse cx="{x+S(3):.1f}" cy="{y+S(2):.1f}" rx="{S(36):.1f}" ry="{S(7):.1f}" fill="#6B4A26" opacity=".22"/>'
        # posts and roof (back)
        f'<path d="M{x-S(26):.1f},{y-S(20):.1f} V{y-S(66):.1f} M{x+S(26):.1f},{y-S(20):.1f} V{y-S(66):.1f}" stroke="#7A5232" stroke-width="{S(4.5):.1f}" stroke-linecap="round"/>'
        f'<path d="M{x-S(36):.1f},{y-S(62):.1f} L{x:.1f},{y-S(82):.1f} L{x+S(36):.1f},{y-S(62):.1f} L{x+S(30):.1f},{y-S(58):.1f} L{x:.1f},{y-S(74):.1f} L{x-S(30):.1f},{y-S(58):.1f}Z" fill="#B0703E"/>'
        f'<path d="M{x-S(26):.1f},{y-S(52):.1f} H{x+S(26):.1f}" stroke="#7A5232" stroke-width="{S(3):.1f}"/>'
        f'<path d="M{x+S(4):.1f},{y-S(52):.1f} V{y-S(38):.1f}" stroke="#5A3A22" stroke-width="{S(1.4):.1f}"/>'
        f'<path d="M{x-S(2):.1f},{y-S(38):.1f} h{S(12):.1f} l-{S(2):.1f},{S(9):.1f} h-{S(8):.1f}z" fill="#8A5A34"/>'
        # stone cylinder
        f'<path d="M{x-S(32):.1f},{y-S(30):.1f} V{y-S(4):.1f} Q{x:.1f},{y+S(6):.1f} {x+S(32):.1f},{y-S(4):.1f} V{y-S(30):.1f}Z" fill="#CDB48A"/>'
        f'<g fill="#E3CFA6">{"".join(stones)}</g>'
        f'<ellipse cx="{x:.1f}" cy="{y-S(30):.1f}" rx="{S(32):.1f}" ry="{S(8):.1f}" fill="#E9D6AE"/>'
        f'<ellipse cx="{x:.1f}" cy="{y-S(30):.1f}" rx="{S(25):.1f}" ry="{S(5.5):.1f}" fill="#4E8FB8"/>'
        f'<g class="tw"><path d="M{x-S(14):.1f},{y-S(31):.1f} h{S(10):.1f} M{x+S(4):.1f},{y-S(29):.1f} h{S(12):.1f}" stroke="#DDF0FB" stroke-width="{S(1.8):.1f}" stroke-linecap="round"/></g>'
    )


def reeds(x, y, s, flip=1):
    S = lambda v: v * s
    st, tops = [], []
    for dx, h, lean in [(-8, 34, -6), (-3, 44, -2), (2, 40, 3), (7, 30, 7), (11, 24, 10)]:
        ex, ey = x + S(dx + lean) * flip, y - S(h)
        st.append(f'M{x + S(dx) * flip:.1f},{y:.1f} Q{x + S(dx + lean * 0.3) * flip:.1f},{y - S(h * 0.6):.1f} {ex:.1f},{ey:.1f}')
        if h > 30:
            tops.append(f'<ellipse cx="{ex:.1f}" cy="{ey + S(6):.1f}" rx="{S(2.4):.1f}" ry="{S(6):.1f}" transform="rotate({lean * 1.5 * flip:.0f} {ex:.1f} {ey + S(6):.1f})"/>')
    leaves = f'M{x:.1f},{y:.1f} Q{x - S(16) * flip:.1f},{y - S(10):.1f} {x - S(22) * flip:.1f},{y - S(26):.1f} Q{x - S(8) * flip:.1f},{y - S(14):.1f} {x + S(2) * flip:.1f},{y:.1f}Z'
    return (f'<path d="{" ".join(st)}" fill="none" stroke="#5E8F5C" stroke-width="{S(2.2):.1f}" stroke-linecap="round"/>'
            f'<path d="{leaves}" fill="#7FB07A"/><g fill="#8A5A34">{"".join(tops)}</g>')


def stone_pad(p, idx, x, y):
    """Empty round stone/clay seal the UI fills. Group id mp_stopN, centred exactly on (x, y)."""
    r = PAD_R
    rnd = random.Random(40 + idx)
    beads = "".join(
        f'<circle cx="{x + (r - 5.5) * math.cos(math.radians(a)):.1f}" cy="{y + (r - 5.5) * math.sin(math.radians(a)):.1f}" r="1.7"/>'
        for a in range(0, 360, 15))
    chips = "".join(
        f'<circle cx="{x + rr * math.cos(a):.1f}" cy="{y + rr * math.sin(a):.1f}" r="{rnd.uniform(1.2, 2.6):.1f}"/>'
        for a, rr in [(rnd.uniform(0, 6.28), rnd.uniform(12, 30)) for _ in range(5)])
    return (
        f'<g id="mp_stop{idx}">'
        f'<ellipse cx="{x}" cy="{y + 8}" rx="{r + 4}" ry="{r - 6}" fill="#4A2E10" opacity=".28"/>'
        f'<circle cx="{x}" cy="{y}" r="{r + 2.5}" fill="#E9B949"/>'
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{p}stone)"/>'
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#8A5A1C" stroke-width="2.5"/>'
        f'<g fill="#FFF4D2" opacity=".85">{beads}</g>'
        f'<circle cx="{x}" cy="{y}" r="{r - 11}" fill="#9A6A3A" opacity=".55"/>'
        f'<circle cx="{x}" cy="{y + 1.5}" r="{r - 12.5}" fill="url(#{p}clay)"/>'
        f'<g fill="#B88A55" opacity=".35">{chips}</g>'
        f'<path d="M{x - r * 0.62:.1f},{y - r * 0.3:.1f} A{r * 0.68:.1f},{r * 0.68:.1f} 0 0 1 {x + r * 0.1:.1f},{y - r * 0.67:.1f}" fill="none" stroke="#FFF8E6" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
        f'</g>')


def compass(p, cx, cy, R):
    """Compass rose; the star spins slowly (lib .spin) inside a static ring."""
    ticks = []
    for i in range(32):
        a = math.radians(i * 360 / 32)
        r0 = R * (0.86 if i % 4 else 0.8)
        ticks.append(f'M{cx + r0 * math.cos(a):.1f},{cy + r0 * math.sin(a):.1f} L{cx + R * 0.93 * math.cos(a):.1f},{cy + R * 0.93 * math.sin(a):.1f}')
    star = []
    for i in range(8):
        ang = -90 + i * 45
        ln = R * (0.78 if i % 2 == 0 else 0.5)
        w = R * (0.13 if i % 2 == 0 else 0.1)
        a = math.radians(ang)
        tip = (ln * math.cos(a), ln * math.sin(a))
        l = (w * math.cos(a - math.pi / 2), w * math.sin(a - math.pi / 2))
        r_ = (w * math.cos(a + math.pi / 2), w * math.sin(a + math.pi / 2))
        cl, cd = ("#F8DC8B", "#B9832A") if i % 2 == 0 else ("#FFF6E5", "#C9A66B")
        if i == 0:
            cl, cd = "#F28B6B", "#C8553D"
        star.append((i % 2, f'<path d="M0,0 L{l[0]:.1f},{l[1]:.1f} L{tip[0]:.1f},{tip[1]:.1f}Z" fill="{cl}"/>'
                     f'<path d="M0,0 L{r_[0]:.1f},{r_[1]:.1f} L{tip[0]:.1f},{tip[1]:.1f}Z" fill="{cd}"/>'))
    star_svg = "".join(s for k, s in sorted(star, key=lambda t: -t[0]))
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{R + 6}" fill="#4A2E10" opacity=".12"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#FFF8EA" opacity=".75"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="url(#{p}gold)" stroke-width="4"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{R * 0.72:.1f}" fill="none" stroke="#B9832A" stroke-width="1.4" opacity=".7"/>'
        f'<path d="{" ".join(ticks)}" stroke="#8A5A1C" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>'
        f'<g transform="translate({cx},{cy})"><g class="spin">'
        f'<circle r="{R * 0.8:.1f}" fill="none" stroke="#000" stroke-opacity="0"/>{star_svg}'
        f'<circle r="{R * 0.1:.1f}" fill="#FFF6E5" stroke="#B9832A" stroke-width="2"/></g></g>'
        f'<path d="M{cx},{cy - R - 18} l7,10 h-14z" fill="#C8553D"/>'
        f'<circle cx="{cx}" cy="{cy - R - 2}" r="4" fill="#E9B949"/>'
    )


def corner_sun(x, y, r):
    return (f'{rays(x, y, 12, r * 0.8, r * 1.7, 10, "#E9B949", 0.9)}'
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="#8A5A1C"/>'
            f'<circle cx="{x}" cy="{y}" r="{r - 3}" fill="#F6C453"/>'
            f'<circle cx="{x}" cy="{y}" r="{r - 7}" fill="#FFF0BE"/>')


def swirl_cloud(x, y, s, op=0.9):
    S = lambda v: v * s
    d = (f'M{x - S(60):.1f},{y:.1f} Q{x - S(62):.1f},{y - S(22):.1f} {x - S(38):.1f},{y - S(20):.1f} '
         f'Q{x - S(30):.1f},{y - S(42):.1f} {x - S(6):.1f},{y - S(36):.1f} Q{x + S(10):.1f},{y - S(52):.1f} {x + S(30):.1f},{y - S(34):.1f} '
         f'Q{x + S(56):.1f},{y - S(36):.1f} {x + S(58):.1f},{y - S(14):.1f} Q{x + S(72):.1f},{y - S(6):.1f} {x + S(64):.1f},{y:.1f}Z')
    return (f'<g opacity="{op}"><path d="{d}" fill="#FFFBF0"/>'
            f'<path d="{d}" fill="none" stroke="#C9A66B" stroke-width="{S(2):.1f}" stroke-linejoin="round"/>'
            f'<path d="M{x - S(30):.1f},{y - S(12):.1f} q{S(8):.1f},-{S(10):.1f} {S(18):.1f},-{S(4):.1f} M{x + S(8):.1f},{y - S(20):.1f} q{S(10):.1f},-{S(10):.1f} {S(20):.1f},-{S(2):.1f}" '
            f'fill="none" stroke="#C9A66B" stroke-width="{S(1.6):.1f}" stroke-linecap="round"/></g>')


def camel(x, y, s):
    S = lambda v: v * s
    return (f'<g fill="#B98A55">'
            f'<path d="M{x - S(22):.1f},{y - S(18):.1f} Q{x - S(14):.1f},{y - S(36):.1f} {x - S(4):.1f},{y - S(24):.1f} Q{x + S(4):.1f},{y - S(38):.1f} {x + S(14):.1f},{y - S(22):.1f} '
            f'L{x + S(20):.1f},{y - S(30):.1f} L{x + S(28):.1f},{y - S(34):.1f} L{x + S(31):.1f},{y - S(30):.1f} L{x + S(24):.1f},{y - S(24):.1f} L{x + S(18):.1f},{y - S(14):.1f} '
            f'Q{x:.1f},{y - S(10):.1f} {x - S(22):.1f},{y - S(14):.1f}Z"/>'
            f'<path d="M{x - S(16):.1f},{y - S(14):.1f} V{y:.1f} M{x - S(10):.1f},{y - S(13):.1f} V{y:.1f} M{x + S(8):.1f},{y - S(13):.1f} V{y:.1f} M{x + S(14):.1f},{y - S(14):.1f} V{y:.1f}" '
            f'stroke="#9A6E44" stroke-width="{S(2.6):.1f}" stroke-linecap="round"/></g>')


# ============================================================ journey map
def build_journey(d_route, segs, ts):
    p = "mj_"
    defs = (
        lin(f"{p}par", [(0, "#FBEFD5"), (0.35, "#F6E7C8"), (0.7, "#F2DFB8"), (1, "#EBD3A3")])
        + rad(f"{p}vig", [(0, "#8A5A1C", 0), (0.62, "#8A5A1C", 0), (1, "#8A5A1C", 0.38)], 0.5, 0.5, 0.75)
        + rad(f"{p}blot", [(0, "#B9832A", 0.16), (1, "#B9832A", 0)])
        + rad(f"{p}blot2", [(0, "#FFFFFF", 0.35), (1, "#FFFFFF", 0)])
        + lin(f"{p}gold", [(0, "#FFF0B8"), (0.3, "#E9B949"), (0.55, "#B9832A"), (0.8, "#F8DC8B"), (1, "#C9973E")], 0, 0, 1, 1)
        + lin(f"{p}stone", [(0, "#F3E2BE"), (0.5, "#D8BC8A"), (1, "#A9875A")], 0, 0, 0.3, 1)
        + rad(f"{p}clay", [(0, "#FBF0D8"), (0.7, "#EAD4A8"), (1, "#D2B27C")], 0.45, 0.4, 0.6)
        + glow_def(f"{p}dawn", "#FFE3A0", 0.85)
        + glow_def(f"{p}peak", "#FFF1C4", 0.95)
        + glow_def(f"{p}warm", "#FFC46B", 0.75)
        + lin(f"{p}mtn", [(0, "#A98FC4"), (0.5, "#8C7BAE"), (1, "#6F6E9A")])
        + lin(f"{p}mtn2", [(0, "#DCCBEA"), (1, "#A996C4")])
        + lin(f"{p}hill", [(0, "#F4DFA6"), (1, "#E3C27E")])
        + lin(f"{p}wall", [(0, "#FFF4D8"), (1, "#E8CD98")])
        + lin(f"{p}water", [(0, "#9CCDEB"), (1, "#5E9ECF")])
        + lin(f"{p}beam", [(0, "#FFF6D8", 0), (1, "#FFF6D8", 0.85)])
        + f'<clipPath id="{p}clip"><rect x="14" y="14" width="572" height="1272" rx="26"/></clipPath>'
    )
    css = (f".{p}rays{{transform-box:fill-box;transform-origin:50% 50%;animation:{p}raysk 60s linear infinite}}"
           f"@keyframes {p}raysk{{to{{transform:rotate(360deg)}}}}"
           f"@media (prefers-reduced-motion:reduce){{.{p}rays{{animation:none}}}}")
    rnd = random.Random(5)
    B = [style(css), f'<rect width="{W}" height="{H}" fill="{P["navy_d"]}"/>']
    M = []  # everything clipped to the parchment

    # ---- parchment
    M.append(f'<rect width="{W}" height="{H}" fill="url(#{p}par)"/>')
    for _ in range(9):
        x, y = rnd.uniform(40, 560), rnd.uniform(60, 1240)
        M.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rnd.uniform(60, 140):.0f}" ry="{rnd.uniform(40, 100):.0f}" fill="url(#{p}blot)"/>')
    for _ in range(5):
        x, y = rnd.uniform(40, 560), rnd.uniform(60, 1240)
        M.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rnd.uniform(80, 160):.0f}" ry="{rnd.uniform(50, 110):.0f}" fill="url(#{p}blot2)"/>')
    # faint fibres
    fib = "".join(f'M{rnd.uniform(20, 560):.0f},{y:.0f} h{rnd.uniform(30, 90):.0f}' for y in [rnd.uniform(30, 1270) for _ in range(46)])
    M.append(f'<path d="{fib}" stroke="#B9832A" stroke-width="1" opacity=".12" stroke-linecap="round"/>')

    # ---- rhumb lines from the compass rose
    CX, CY, CR = 100, 455, 50
    rl = "".join(f'M{CX},{CY} L{CX + 1500 * math.cos(math.radians(a)):.0f},{CY + 1500 * math.sin(math.radians(a)):.0f}' for a in range(0, 360, 22))
    M.append(f'<path d="{rl}" stroke="#8A5A1C" stroke-width="1" opacity=".09"/>')

    # ---- dawn glow behind the holy city (top)
    M.append(f'<circle cx="300" cy="105" r="300" fill="url(#{p}dawn)"/>')
    M.append(f'<g transform="translate(300,96)">{rays(0, 0, 18, 70, 270, 5, "#FFE9A8", 0.28)}</g>')

    # ---- terrain washes, bottom to top
    # desert camp
    M.append(f'<path d="M14,1150 Q120,1120 230,1150 T460,1140 T600,1150 V1300 H14Z" fill="#F0D6A0" opacity=".75"/>')
    M.append(f'<path d="M14,1215 Q150,1190 300,1222 T600,1205 V1300 H14Z" fill="#E7C487" opacity=".55"/>')
    # village meadow
    M.append(f'<path d="M14,1100 C90,980 200,950 330,975 C440,995 520,960 586,980 V1135 C470,1110 380,1135 300,1120 C200,1100 100,1130 14,1135Z" fill="#CFDDA0" opacity=".6"/>')
    # shepherds field
    M.append(f'<path d="M14,900 C140,860 260,880 380,770 C460,740 540,760 586,770 V960 C500,935 420,960 330,945 C220,925 120,955 14,960Z" fill="#A9CC8E" opacity=".55"/>')
    M.append(f'<path d="M230,900 C300,850 380,800 460,790 C520,790 560,830 586,850 V930 C500,915 440,930 360,920 C300,915 250,915 230,900Z" fill="#8DBB7A" opacity=".35"/>')
    # river (Jordan-like), banks then water
    river = "M-20,560 C90,560 130,640 240,655 S430,690 620,640"
    M.append(f'<path d="{river}" fill="none" stroke="#E9D3A0" stroke-width="92" stroke-linecap="round"/>')
    M.append(f'<path d="{river}" fill="none" stroke="#B9D8A0" stroke-width="74" stroke-linecap="round" opacity=".7"/>')
    M.append(f'<path d="{river}" fill="none" stroke="#6FA9D3" stroke-width="58" stroke-linecap="round"/>')
    M.append(f'<path d="{river}" fill="none" stroke="url(#{p}water)" stroke-width="50" stroke-linecap="round"/>')
    M.append(f'<path d="{river}" fill="none" stroke="#B5DCF2" stroke-width="14" stroke-linecap="round" opacity=".45" transform="translate(0,-9)"/>')
    # holy city hill (top)
    M.append(f'<path d="M14,330 C110,300 170,250 250,236 C330,224 400,236 470,250 C520,262 560,240 586,236 V330 C480,300 360,330 260,318 C160,310 90,340 14,350Z" fill="url(#{p}hill)" opacity=".8"/>')
    M.append(f'<path d="M110,270 C170,190 230,180 300,178 C380,176 440,200 500,270 C430,262 380,250 300,258 C220,262 170,262 110,270Z" fill="#EDCF8C"/>')

    # mountain (stop 4) with lit peak
    MX, MY = 470, 250
    M.append(f'<path d="M232,548 C262,516 296,486 326,452 L352,428 L374,440 L404,372 L436,318 L{MX},{MY} L500,292 L522,280 L548,318 L572,300 L620,350 V560Z" fill="url(#{p}mtn)"/>')
    M.append(f'<path d="M232,548 C262,516 296,486 326,452 L352,428 L374,440 L404,372 L436,318 L{MX},{MY} L458,320 L440,360 L446,410 L420,470 L430,540Z" fill="url(#{p}mtn2)"/>')
    M.append(f'<path d="M{MX},{MY} L500,292 L486,300 L478,320 L466,304 L452,322 L444,306 L436,318Z" fill="#FFF8E6"/>'
             f'<path d="M522,280 L548,318 L536,316 L528,330 L518,312 L508,318Z" fill="#FFF8E6" opacity=".9"/>'
             f'<path d="M{MX},{MY} L458,320 L440,360 L446,410 L420,470" fill="none" stroke="#8E86A8" stroke-width="2" opacity=".5" stroke-linejoin="round"/>'
             f'<path d="M500,292 L492,350 L510,400 M548,318 L556,380 M404,372 L392,420" fill="none" stroke="#7E7398" stroke-width="2" opacity=".45" stroke-linecap="round"/>')
    M.append(f'<path d="M330,520 C360,470 400,470 430,486 C470,460 520,450 600,470 V540 H330Z" fill="#9C8DB8" opacity=".55"/>')
    M.append(f'<path d="M226,566 C300,500 360,500 440,520 C510,538 560,505 600,498 V590 H226Z" fill="#C9DDA6" opacity=".7"/>')
    # ---- the road: earth band + dashed line (mp_route)
    M.append(f'<path d="{d_route}" fill="none" stroke="#C9A66B" stroke-width="26" stroke-linecap="round" opacity=".55"/>')
    M.append(f'<path d="{d_route}" fill="none" stroke="#F3E1B6" stroke-width="18" stroke-linecap="round"/>')
    # stepping stones where the road crosses the river
    riv_seg = ((-20, 560), (90, 560), (130, 640), (240, 655))
    riv_seg2 = ((240, 655), (350, 670), (430, 690), (620, 640))
    rpts = [cubic(*riv_seg, i / 200) for i in range(201)] + [cubic(*riv_seg2, i / 200) for i in range(201)]
    rsamp = sample_route(segs, 160)
    stones, last = [], None
    for q in rsamp:
        dmin = min(math.hypot(q[0] - r_[0], q[1] - r_[1]) for r_ in rpts)
        near_pad = math.hypot(q[0] - STOPS[2][0], q[1] - STOPS[2][1]) < PAD_R + 6
        if dmin < 27 and not near_pad and (last is None or math.hypot(q[0] - last[0], q[1] - last[1]) > 15):
            stones.append(f'<ellipse cx="{q[0]:.1f}" cy="{q[1] + 2:.1f}" rx="10" ry="6" fill="#7A6A58" opacity=".5"/>'
                          f'<ellipse cx="{q[0]:.1f}" cy="{q[1]:.1f}" rx="9.5" ry="5.6" fill="#E3D3B4"/>')
            last = q
    M.append("".join(stones))
    M.append(f'<path id="mp_route" d="{d_route}" fill="none" stroke="#8A5A1C" stroke-width="5" stroke-dasharray="1 11" stroke-linecap="round" opacity=".8"/>')

    # river shimmer (1 anim: drift)
    sh = []
    for i in range(14):
        u = 0.05 + i * 0.068
        q = cubic(*riv_seg, u * 2) if u < 0.5 else cubic(*riv_seg2, (u - 0.5) * 2)
        off = (-8, 6, -2, 9)[i % 4]
        sh.append(f'M{q[0] - 9:.1f},{q[1] + off:.1f} q4.5,-3 9,0 q4.5,3 9,0')
    M.append(f'<g class="drift"><path d="{" ".join(sh)}" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".75"/></g>')
    # sandbar under stop 3
    M.append(f'<ellipse cx="{STOPS[2][0]}" cy="{STOPS[2][1] + 14}" rx="74" ry="38" fill="#EBD5A2"/>'
             f'<ellipse cx="{STOPS[2][0]}" cy="{STOPS[2][1] + 14}" rx="74" ry="38" fill="none" stroke="#FFF8E6" stroke-width="3" opacity=".6"/>')
    M.append(boat(470, 676, 0.9))
    M.append(reeds(110, 608, 1.0) + reeds(285, 628, 0.85, -1) + reeds(340, 720, 1.0)
             + reeds(520, 705, 0.95, -1) + reeds(560, 615, 0.8) + reeds(262, 676, 0.8))

    # ---- start camp (bottom)
    M.append(tent(160, 1232, 1.05, "#E6A96B", "#B8553D") + tent(458, 1226, 0.95, "#F2D7A6", "#5E9ECF"))
    M.append(palm(530, 1180, 0.9) + palm(70, 1205, 0.85) + camel(524, 1246, 0.8))
    fx, fy = 382, 1250
    M.append(f'<circle cx="{fx}" cy="{fy - 10}" r="42" fill="url(#{p}warm)"/>'
             f'<path d="M{fx - 16},{fy + 4} L{fx + 16},{fy - 4} M{fx - 16},{fy - 4} L{fx + 16},{fy + 4}" stroke="#7A4A26" stroke-width="5" stroke-linecap="round"/>'
             + "".join(f'<circle cx="{fx + 20 * math.cos(a):.1f}" cy="{fy + 2 + 6 * math.sin(a):.1f}" r="3.6" fill="#B8A07E"/>' for a in [i * 0.7854 for i in range(8)])
             + flame(fx, fy + 1, 0.42))
    # start spot (small, so the marker can stand there)
    sx, sy = START
    M.append(f'<ellipse cx="{sx}" cy="{sy + 2}" rx="30" ry="11" fill="#C9A66B" opacity=".55"/>'
             f'<ellipse cx="{sx}" cy="{sy}" rx="26" ry="9" fill="#FFF4D8"/>'
             f'<ellipse cx="{sx}" cy="{sy}" rx="26" ry="9" fill="none" stroke="#B9832A" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>')

    # ---- stop 1: village well + olive trees
    M.append(olive_tree(60, 1000, 1.0) + olive_tree(92, 1072, 0.8))
    M.append(house(470, 1086, 40, 30) + house(512, 1080, 34, 40, dome=True) + house(440, 1110, 34, 24))
    M.append(olive_tree(400, 1095, 0.9) + olive_tree(560, 1010, 0.85))
    M.append(well(p, 318, 1050, 0.95))
    M.append(cypress(536, 1128, 0.7) + cypress(80, 1148, 0.6))

    # ---- stop 2: shepherds' field
    M.append(f'<path d="M500,900 q20,-6 40,0 q20,6 40,0 M210,780 q16,-5 32,0 q16,5 32,0" fill="none" stroke="#6F9C5F" stroke-width="2" opacity=".6" stroke-linecap="round"/>')
    # sheepfold (low stone ring)
    M.append(f'<ellipse cx="535" cy="770" rx="40" ry="16" fill="none" stroke="#CDB48A" stroke-width="9"/>'
             f'<ellipse cx="535" cy="770" rx="40" ry="16" fill="none" stroke="#E9D6AE" stroke-width="5" stroke-dasharray="7 4"/>')
    M.append(sheep(250, 845, 0.3, cls="bob") + sheep(305, 905, 0.26) + sheep(540, 930, 0.28, cls="bob")
             + sheep(530, 760, 0.22))
    # shepherd's crook planted in the ground
    M.append(f'<path d="M352,820 V770 q0,-14 -10,-14 q-9,0 -9,9" fill="none" stroke="#7A5232" stroke-width="4" stroke-linecap="round"/>')
    M.append(olive_tree(140, 900, 0.8))
    M.append(cypress(54, 820, 0.75) + cypress(70, 830, 0.6))

    # ---- stop 4 extras: light on the mountain top (2 anim: rays + glow)
    M.append(f'<g class="glow"><circle cx="{MX}" cy="{MY}" r="95" fill="url(#{p}peak)"/></g>')
    M.append(f'<g transform="translate({MX},{MY})"><g class="{p}rays">{rays(0, 0, 14, 20, 100, 6, "#FFF6D8", 0.5)}</g></g>')
    M.append(f'<circle cx="{MX}" cy="{MY}" r="13" fill="#FFFBEE"/>' + sparkle_star(MX, MY, 22, "#FFFFFF"))
    M.append(cypress(296, 520, 0.6) + cypress(560, 520, 0.7) + olive_tree(232, 470, 0.7))

    # ---- stop 5: the holy city gate (top)
    walls = []
    WL, WR, WT, WB = 176, 424, 124, 180
    walls.append(f'<path d="M{WL - 10},{WB + 8} L{WL},{WT} H{WR} L{WR + 10},{WB + 8}Z" fill="#6B4A26" opacity=".15"/>')
    # buildings behind the wall
    walls.append('<g transform="translate(0,8)">')
    walls.append(f'<g fill="#F2DDB4">'
                 f'<rect x="196" y="92" width="30" height="30"/><rect x="232" y="80" width="26" height="40"/>'
                 f'<rect x="342" y="84" width="28" height="36"/><rect x="376" y="96" width="30" height="26"/></g>'
                 f'<g fill="#DDBF8C"><rect x="216" y="92" width="10" height="30"/><rect x="360" y="84" width="10" height="36"/></g>')
    # temple dome
    walls.append(f'<rect x="262" y="66" width="76" height="54" fill="url(#{p}wall)"/>'
                 f'<path d="M266,68 A34,32 0 0 1 334,68Z" fill="#F6C453"/><path d="M276,64 A24,20 0 0 1 300,40" fill="none" stroke="#FFF4D2" stroke-width="3" stroke-linecap="round" opacity=".8"/>'
                 f'<path d="M300,36 V24 M294,30 H306" stroke="#E9B949" stroke-width="3" stroke-linecap="round"/>'
                 + "".join(f'<path d="M{x},108 v-14 a5,5 0 0 1 10,0 v14z" fill="#C98F48"/>' for x in (272, 295, 318)))
    walls.append('</g>')
    # wall with crenellations
    walls.append(f'<rect x="{WL}" y="{WT}" width="{WR - WL}" height="{WB - WT}" fill="url(#{p}wall)"/>')
    cren = "".join(f'<rect x="{x}" y="{WT - 8}" width="10" height="9" rx="1"/>' for x in range(WL + 2, WR - 6, 16))
    walls.append(f'<g fill="#F7E6C2">{cren}</g>')
    walls.append(f'<path d="M{WL},{WT + 18} H{WR} M{WL},{WT + 36} H{WR}" stroke="#D9BC86" stroke-width="1.4" stroke-dasharray="22 8" opacity=".8"/>')
    # towers
    for tx in (WL - 8, WR - 22):
        walls.append(f'<rect x="{tx}" y="{WT - 26}" width="30" height="{WB - WT + 28}" fill="#F7E6C2"/>'
                     f'<rect x="{tx + 20}" y="{WT - 26}" width="10" height="{WB - WT + 28}" fill="#E3C890"/>'
                     + "".join(f'<rect x="{tx + k * 10}" y="{WT - 34}" width="7" height="9" rx="1" fill="#F7E6C2"/>' for k in range(3))
                     + f'<path d="M{tx + 10},{WT - 2} v-9 a5,5 0 0 1 10,0 v9z" fill="#8A5A34"/>')
    # gate tower + arched gate with warm light
    GX = 300
    walls.append(f'<rect x="{GX - 40}" y="{WT - 20}" width="80" height="{WB - WT + 20}" fill="#FFF1D2"/>'
                 + "".join(f'<rect x="{GX - 40 + k * 15}" y="{WT - 29}" width="10" height="10" rx="1" fill="#FFF1D2"/>' for k in range(6))
                 + f'<path d="M{GX - 22},{WB} V{WT + 14} A22,22 0 0 1 {GX + 22},{WT + 14} V{WB}Z" fill="#B9832A"/>'
                 f'<path d="M{GX - 17},{WB} V{WT + 16} A17,17 0 0 1 {GX + 17},{WT + 16} V{WB}Z" fill="#FFE7A6"/>'
                 f'<path d="M{GX - 17},{WB} V{WT + 16} A17,17 0 0 1 {GX + 17},{WT + 16} V{WB}Z" fill="url(#{p}beam)"/>'
                 f'<path d="M{GX - 28},{WT + 12} A28,28 0 0 1 {GX + 28},{WT + 12}" fill="none" stroke="#E9B949" stroke-width="4"/>')
    M.append("".join(walls))
    # light spilling out of the gate onto the hill (static)
    M.append(f'<ellipse cx="{GX}" cy="{WB + 6}" rx="70" ry="26" fill="url(#{p}dawn)"/>')
    # gate lamps (1 anim: flame)
    M.append(f'<path d="M{GX - 34},{WB - 4} V{WT + 30} M{GX + 34},{WB - 4} V{WT + 30}" stroke="#7A5232" stroke-width="3" stroke-linecap="round"/>'
             f'<circle cx="{GX - 34}" cy="{WT + 26}" r="14" fill="url(#{p}warm)"/><circle cx="{GX + 34}" cy="{WT + 26}" r="14" fill="url(#{p}warm)"/>'
             f'<g transform="translate({GX - 34},{WT + 30})"><g class="fl"><path d="M0,0 c-5,-2 -5,-8 0,-14 c5,6 5,12 0,14z" fill="#F6A04D"/><path d="M0,-1 c-2.4,-1 -2.4,-4 0,-7 c2.4,3 2.4,6 0,7z" fill="#FFE9A8"/></g></g>'
             f'<g transform="translate({GX + 34},{WT + 30})"><path d="M0,0 c-5,-2 -5,-8 0,-14 c5,6 5,12 0,14z" fill="#F6A04D"/><path d="M0,-1 c-2.4,-1 -2.4,-4 0,-7 c2.4,3 2.4,6 0,7z" fill="#FFE9A8"/></g>')
    M.append(olive_tree(130, 262, 0.75) + cypress(152, 248, 0.55) + cypress(420, 214, 0.55) + olive_tree(534, 236, 0.55))
    # star above the city (1 anim) + two small twinkles (2 anim)
    M.append(f'<g class="tw">{sparkle_star(116, 160, 14, "#E9B949")}</g>')
    M.append(f'<g class="tw2">{sparkle_star(488, 150, 11, "#E9B949")}{sparkle_star(540, 210, 6, "#E9B949")}</g>')
    M.append(f'<g class="tw3">{sparkle_star(70, 230, 7, "#E9B949")}{sparkle_star(436, 56, 8, "#E9B949")}</g>')
    M.append(f'<g fill="#E9B949" opacity=".7">' + "".join(
        f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in [(170, 52, 2.2), (420, 30, 1.8), (520, 96, 2), (84, 110, 1.8), (560, 160, 1.6), (230, 34, 1.6)]) + '</g>')

    # ---- decorative clouds and doves
    M.append(swirl_cloud(560, 520, 0.6, 0.9) + swirl_cloud(110, 790, 0.6, 0.8))
    M.append(dove(150, 345, 0.62, "#FFFDF6") + dove(486, 560, 0.5, "#FFFDF6", flip=True))

    # ---- compass rose
    M.append(compass(p, CX, CY, CR))

    # ---- stop pads (on top of everything else in the map body)
    for i, (x, y) in enumerate(STOPS, 1):
        M.append(stone_pad(p, i, x, y))

    # ---- vignette
    M.append(f'<rect width="{W}" height="{H}" fill="url(#{p}vig)"/>')

    B.append(f'<g clip-path="url(#{p}clip)">{"".join(M)}</g>')

    # ---- gold-leaf border
    B.append(f'<rect x="14" y="14" width="572" height="1272" rx="26" fill="none" stroke="#5E3A12" stroke-width="14"/>'
             f'<rect x="14" y="14" width="572" height="1272" rx="26" fill="none" stroke="url(#{p}gold)" stroke-width="9"/>'
             f'<rect x="14" y="14" width="572" height="1272" rx="26" fill="none" stroke="#FFF6E5" stroke-width="1.6" stroke-dasharray="1 9" stroke-linecap="round" opacity=".9"/>'
             f'<rect x="28" y="28" width="544" height="1244" rx="16" fill="none" stroke="#B9832A" stroke-width="2" opacity=".75"/>'
             f'<rect x="33" y="33" width="534" height="1234" rx="13" fill="none" stroke="#E9B949" stroke-width="1" opacity=".6"/>')
    # olive-leaf inlay along the long sides
    leaves = []
    for y in range(110, 1200, 48):
        for x, sgn in ((28, 1), (572, -1)):
            leaves.append(f'<ellipse cx="{x + sgn * 0.5:.1f}" cy="{y}" rx="7" ry="2.8" transform="rotate({sgn * 35} {x} {y})"/>'
                          f'<ellipse cx="{x + sgn * 0.5:.1f}" cy="{y + 12}" rx="7" ry="2.8" transform="rotate({-sgn * 35} {x} {y + 12})"/>')
    B.append(f'<g fill="#B9832A" opacity=".55">{"".join(leaves)}</g>')
    for x, y in [(30, 30), (570, 30), (30, 1270), (570, 1270)]:
        B.append(corner_sun(x, y, 13))
    for x, y in [(300, 20), (300, 1280)]:
        B.append(f'<g>{sparkle_star(x, y, 14, "#F8DC8B")}<circle cx="{x}" cy="{y}" r="4" fill="#8A5A1C"/></g>')

    return svg(W, H, "".join(B), defs, anim=True, extra_attr='preserveAspectRatio="xMidYMid slice"')


# ============================================================ marker
def build_marker():
    """Lamp-bearer pilgrim with a little lamb. Anchor (feet / shadow centre) = (50, 92)."""
    p = "mk_"
    defs = (glow_def(f"{p}glow", "#FFD36E", 0.85)
            + lin(f"{p}robe", [(0, "#F2E3C4"), (1, "#D9BE8E")])
            + lin(f"{p}cloak", [(0, "#5E9ECF"), (1, "#2C5BA8")])
            + lin(f"{p}lamp", [(0, "#F0A35E"), (0.6, "#C9733A"), (1, "#8E4A22")]))
    b = []
    # warm glow behind (1 anim)
    b.append(f'<g class="glow"><circle cx="62" cy="34" r="34" fill="url(#{p}glow)"/></g>')
    b.append(f'<ellipse cx="50" cy="92" rx="30" ry="5.5" fill="#2A1A10" opacity=".3"/>')
    # staff (behind)
    b.append(f'<path d="M30,92 L33,30 q1,-8 -6,-9 q-7,0 -6,7" fill="none" stroke="#7A5232" stroke-width="3.4" stroke-linecap="round"/>')
    # robe
    b.append(f'<path d="M44,44 C34,48 33,70 28,90 Q47,95 66,90 C61,70 60,48 52,44Z" fill="url(#{p}robe)"/>')
    # cloak / mantle
    b.append(f'<path d="M42,44 C33,50 32,72 28,90 Q36,92 42,92 C40,76 42,58 49,46Z" fill="url(#{p}cloak)"/>')
    b.append(f'<path d="M38,82 Q47,85 64,82" fill="none" stroke="#E9B949" stroke-width="2"/>')
    # sash
    b.append(f'<path d="M38,62 Q48,66 60,62" fill="none" stroke="#C8553D" stroke-width="3" stroke-linecap="round"/>')
    # left arm to staff
    b.append(f'<path d="M42,50 Q34,56 32,60" fill="none" stroke="#D9BE8E" stroke-width="7" stroke-linecap="round"/>'
             f'<circle cx="32" cy="60" r="3.6" fill="#E2AD7E"/>')
    # head with hood + face
    b.append(f'<path d="M37,42 C35,28 42,20 49,20 C57,20 63,28 61,42 Q49,47 37,42Z" fill="url(#{p}cloak)"/>'
             f'<circle cx="49" cy="33" r="9" fill="#F0C8A0"/>'
             f'<path d="M40,30 C41,22 47,21 49,21 C53,21 58,23 58,30 C54,27 46,26 40,30Z" fill="#2C5BA8"/>'
             f'<circle cx="46" cy="34" r="1.3" fill="#3B2A22"/><circle cx="53" cy="34" r="1.3" fill="#3B2A22"/>'
             f'<path d="M46.5,38 Q49.5,40 52.5,38" fill="none" stroke="#3B2A22" stroke-width="1.2" stroke-linecap="round"/>'
             f'<circle cx="43.5" cy="37" r="1.8" fill="#F28B82" opacity=".5"/><circle cx="55.5" cy="37" r="1.8" fill="#F28B82" opacity=".5"/>')
    # right arm raising the clay lamp
    b.append(f'<path d="M56,50 Q66,50 68,42" fill="none" stroke="#D9BE8E" stroke-width="7" stroke-linecap="round"/>'
             f'<circle cx="68" cy="42" r="3.6" fill="#F0C8A0"/>')
    # clay lamp on the palm
    b.append(f'<path d="M58,38 C58,33 64,32 69,32 C73,32 76,33 79,34 L84,32 C87,31 88,34 86,35 L80,38 C77,41 72,42 68,42 C62,42 58,41 58,38Z" fill="url(#{p}lamp)"/>'
             f'<ellipse cx="67" cy="34" rx="3" ry="1" fill="#6B3418"/>'
             f'<path d="M61,37 Q66,39 74,38" fill="none" stroke="#F7C99A" stroke-width="1" stroke-dasharray="1 2.4" stroke-linecap="round"/>')
    # flame on the nozzle (1 anim)
    b.append(flame(85, 33, 0.26))
    # small lamb trotting along (static)
    b.append(sheep(80, 80, 0.15))
    return svg(100, 100, "".join(b), defs, anim=True)


# ============================================================ done badges (wax seals)
def wax_path(cx, cy, r, seed, lobes=11):
    rnd = random.Random(seed)
    n = lobes * 2
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r * (1.0 if i % 2 == 0 else 0.92) * (1 + rnd.uniform(-0.03, 0.03))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d = [f"M{(pts[0][0] + pts[1][0]) / 2:.1f},{(pts[0][1] + pts[1][1]) / 2:.1f}"]
    for i in range(1, n + 1):
        a_ = pts[i % n]
        b_ = pts[(i + 1) % n]
        d.append(f"Q{a_[0]:.1f},{a_[1]:.1f} {(a_[0] + b_[0]) / 2:.1f},{(a_[1] + b_[1]) / 2:.1f}")
    return " ".join(d) + "Z"


def build_done_good():
    p = "sg_"
    defs = (lin(f"{p}wax", [(0, "#FFE6A0"), (0.45, "#E9B949"), (1, "#A8701E")], 0, 0, 0.4, 1)
            + rad(f"{p}face", [(0, "#FFF6D8"), (0.6, "#F8DC8B"), (1, "#D9A03A")], 0.45, 0.4, 0.6))
    b = [f'<path d="{wax_path(50, 53, 46, 3)}" fill="#5E3A12" opacity=".35"/>',
         f'<path d="{wax_path(50, 50, 46, 3)}" fill="url(#{p}wax)"/>',
         f'<circle cx="50" cy="50" r="34" fill="#B9832A" opacity=".6"/>',
         f'<circle cx="50" cy="51" r="32.5" fill="url(#{p}face)"/>',
         f'<circle cx="50" cy="50" r="28" fill="none" stroke="#B9832A" stroke-width="1.4" stroke-dasharray="1.5 4" stroke-linecap="round"/>',
         rays(50, 50, 12, 12, 30, 9, "#FFFFFF", 0.7),
         f'<circle cx="50" cy="50" r="12" fill="#FFF8E2"/>',
         # embossed dove
         f'<g transform="translate(49,52) scale(.62)">'
         f'<path d="M-30,6 Q-8,-4 10,2 Q22,-2 30,-8 Q26,4 16,8 Q4,16 -14,14 Q-24,12 -30,6Z" fill="#FFFFFF" stroke="#B9832A" stroke-width="2.2"/>'
         f'<path d="M-6,2 Q-18,-30 6,-40 Q4,-18 12,0Z" fill="#FFFFFF" stroke="#B9832A" stroke-width="2.2"/>'
         f'<path d="M2,4 Q14,-22 34,-26 Q24,-8 16,6Z" fill="#FFF6E0" stroke="#B9832A" stroke-width="2.2"/>'
         f'<circle cx="24" cy="-4" r="2.4" fill="#4A3426"/><path d="M30,-6 L37,-4 L30,-2Z" fill="#F4A259"/></g>',
         # olive leaves under it
         f'<g fill="#5E8F5C"><ellipse cx="36" cy="70" rx="7" ry="2.8" transform="rotate(-25 36 70)"/>'
         f'<ellipse cx="64" cy="70" rx="7" ry="2.8" transform="rotate(25 64 70)"/>'
         f'<ellipse cx="44" cy="74" rx="6" ry="2.4" transform="rotate(-10 44 74)"/><ellipse cx="56" cy="74" rx="6" ry="2.4" transform="rotate(10 56 74)"/></g>',
         f'<path d="M18,36 A34,34 0 0 1 44,16" fill="none" stroke="#FFF8E6" stroke-width="3" stroke-linecap="round" opacity=".7"/>',
         f'<g class="tw">{sparkle_star(80, 20, 8, "#FFFFFF")}</g>']
    return svg(100, 100, "".join(b), defs, anim=True)


def build_done_evil():
    p = "se_"
    defs = (lin(f"{p}wax", [(0, "#B48CE0"), (0.45, "#6A4590"), (1, "#2E1C44")], 0, 0, 0.4, 1)
            + rad(f"{p}face", [(0, "#7E57A6"), (1, "#3A2550")], 0.5, 0.4, 0.65)
            + lin(f"{p}cl", [(0, "#E4E8F0"), (0.6, "#B4BDD0"), (1, "#8A93A8")]))
    parts = [(36, 56, 11), (48, 47, 14), (62, 53, 11), (70, 59, 7), (29, 60, 7)]
    cl = "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in parts) + '<rect x="27" y="56" width="50" height="12" rx="6"/>'
    b = [f'<path d="{wax_path(50, 53, 46, 8)}" fill="#1E1230" opacity=".4"/>',
         f'<path d="{wax_path(50, 50, 46, 8)}" fill="url(#{p}wax)"/>',
         f'<circle cx="50" cy="50" r="34" fill="#2A1A3C" opacity=".7"/>',
         f'<circle cx="50" cy="51" r="32.5" fill="url(#{p}face)"/>',
         f'<circle cx="50" cy="50" r="28" fill="none" stroke="#B48CE0" stroke-width="1.4" stroke-dasharray="1.5 4" stroke-linecap="round" opacity=".7"/>',
         # crescent moon peeking
         f'<path d="M66,22 A12,12 0 1,0 72,44 A9,9 0 1,1 66,22Z" fill="#F3E9C6"/>',
         # cloud with a sulky face
         f'<g fill="#3A2550" opacity=".5" transform="translate(1.5,3)">{cl}</g>',
         f'<g fill="url(#{p}cl)">{cl}</g>',
         f'<path d="M40,46 Q45,39 52,40" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>',
         f'<path d="M41,54 l5,1.6 M59,54 l-5,1.6" stroke="#4A4560" stroke-width="1.8" stroke-linecap="round"/>',
         f'<circle cx="45" cy="58.5" r="1.7" fill="#4A4560"/><circle cx="55" cy="58.5" r="1.7" fill="#4A4560"/>',
         f'<path d="M47,64 Q50,62 53,64" fill="none" stroke="#4A4560" stroke-width="1.6" stroke-linecap="round"/>',
         f'<g fill="#A8C9EE">' + "".join(f'<path d="M{x},{y} c-2,3.4 -2.6,5.4 0,6 c2.6,-.6 2,-2.6 0,-6z"/>' for x, y in [(38, 72), (50, 75), (62, 72)]) + '</g>',
         f'<path d="M18,36 A34,34 0 0 1 44,16" fill="none" stroke="#E4D6F5" stroke-width="3" stroke-linecap="round" opacity=".5"/>',
         f'<g class="tw2">{sparkle_star(24, 30, 5, "#E4D6F5")}{sparkle_star(78, 74, 4, "#E4D6F5")}</g>']
    return svg(100, 100, "".join(b), defs, anim=True)


# ============================================================ current-stop halo
def build_current():
    p = "sc_"
    css = (f".{p}rip{{transform-box:fill-box;transform-origin:50% 50%;animation:{p}ripk 2.4s ease-out infinite}}"
           f".{p}rip2{{transform-box:fill-box;transform-origin:50% 50%;animation:{p}ripk 2.4s ease-out infinite 1.2s}}"
           f".{p}pulse{{transform-box:fill-box;transform-origin:50% 50%;animation:{p}pulsek 1.6s ease-in-out infinite}}"
           f".{p}turn{{transform-box:fill-box;transform-origin:50% 50%;animation:{p}turnk 24s linear infinite}}"
           f"@keyframes {p}ripk{{0%{{transform:scale(.82);opacity:.9}}100%{{transform:scale(1.18);opacity:0}}}}"
           f"@keyframes {p}pulsek{{0%,100%{{transform:scale(1);opacity:1}}50%{{transform:scale(1.05);opacity:.72}}}}"
           f"@keyframes {p}turnk{{to{{transform:rotate(360deg)}}}}"
           f"@media (prefers-reduced-motion:reduce){{.{p}rip,.{p}rip2,.{p}pulse,.{p}turn{{animation:none}}.{p}rip,.{p}rip2{{opacity:.5}}}}")
    defs = (rad(f"{p}halo", [(0, "#FFE9A8", 0), (0.62, "#FFE9A8", 0), (0.75, "#FFD36E", 0.75), (0.88, "#FFD36E", 0.25), (1, "#FFD36E", 0)])
            + lin(f"{p}gold", [(0, "#FFF0B8"), (0.4, "#E9B949"), (0.7, "#B9832A"), (1, "#F8DC8B")], 0, 0, 1, 1))
    c = 70
    sparks = "".join(sparkle_star(c + 58 * math.cos(math.radians(a)), c + 58 * math.sin(math.radians(a)), 7, "#FFF6D8")
                     for a in (-90, 0, 90, 180))
    dots = "".join(f'<circle cx="{c + 58 * math.cos(math.radians(a)):.1f}" cy="{c + 58 * math.sin(math.radians(a)):.1f}" r="1.8"/>'
                   for a in range(0, 360, 15) if a % 90)
    b = [style(css),
         f'<circle cx="{c}" cy="{c}" r="69" fill="url(#{p}halo)" class="{p}pulse"/>',
         f'<circle cx="{c}" cy="{c}" r="56" fill="none" stroke="#FFD36E" stroke-width="5" class="{p}rip"/>',
         f'<circle cx="{c}" cy="{c}" r="56" fill="none" stroke="#FFE9A8" stroke-width="3" class="{p}rip2"/>',
         f'<circle cx="{c}" cy="{c}" r="51" fill="none" stroke="url(#{p}gold)" stroke-width="4"/>',
         f'<g class="{p}turn"><circle cx="{c}" cy="{c}" r="58" fill="none" stroke="#000" stroke-opacity="0"/>'
         f'<g fill="#FFF6D8">{dots}</g>{sparks}</g>']
    return svg(140, 140, "".join(b), defs, anim=False)


# ============================================================ main
def main():
    d, segs, ts, total = build_route()
    # every stop centre is a segment end point -> lies exactly on the route
    for s, st in zip(segs, STOPS):
        assert abs(s[3][0] - st[0]) < 1e-9 and abs(s[3][1] - st[1]) < 1e-9
    write("map/journey.svg", build_journey(d, segs, ts))
    route = {
        "viewBox": f"0 0 {W} {H}",
        "route": d,
        "routeLength": round(total, 1),
        "start": {"x": START[0], "y": START[1]},
        "stops": [{"x": x, "y": y, "r": PAD_R, "t": round(t, 4)} for (x, y), t in zip(STOPS, ts)],
        "markerSize": MARKER_SIZE,
        "markerAnchor": {"x": 0.5, "y": 0.92},
        "badgeSize": 84,
        "currentSize": 140,
    }
    write("map/route.json", json.dumps(route, ensure_ascii=False, indent=2) + "\n")
    write("map/marker.svg", build_marker())
    write("map/stop-done-good.svg", build_done_good())
    write("map/stop-done-evil.svg", build_done_evil())
    write("map/stop-current.svg", build_current())


if __name__ == "__main__":
    main()
