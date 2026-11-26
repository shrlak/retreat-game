"""Shared drawing helpers for the 빛의 원정대 asset set.

Every SVG is generated from code so the style stays consistent.
All ids inside one file are prefixed so several SVGs can be inlined
into one HTML page without gradient/clip id collisions.
"""
import math
import random

# ---------------------------------------------------------------- palette
P = {
    # light / good team
    "gold": "#E9B949", "gold_l": "#F8DC8B", "gold_d": "#B9832A", "gold_dd": "#8A5A1C",
    "cream": "#FFF6E5", "parch": "#F6E7C8", "parch_d": "#E3CC9E",
    "amber": "#F4A259", "amber_d": "#D9813A", "coral": "#F28B6B",
    "sky": "#8EC5E8", "sky_d": "#5E9ECF", "dawn": "#FFD9A0",
    "pine": "#2F5D50", "pine_l": "#4F8A6E", "meadow": "#7FB07A", "meadow_d": "#5E8F5C",
    "ink": "#4A3426", "ink_l": "#7A5C46",
    # night / evil team (mischief, never scary)
    "navy": "#1E2A4A", "navy_d": "#141B33", "navy_l": "#2C3E6B", "dusk": "#3C5A8A",
    "plum": "#5B3A7A", "plum_d": "#3A2550", "plum_l": "#7E57A6", "lilac": "#B48CE0", "lav": "#E4D6F5",
    "mist": "#A8B3C9",
    # people
    "skin1": "#F6D2AF", "skin2": "#E2AD7E", "skin3": "#B87A52", "skin4": "#8D5A3B",
    "blush": "#F28B82",
    "white": "#FFFFFF",
}

STYLE_ANIM = """
<style>
  .tw{animation:tw 3.2s ease-in-out infinite}
  .tw2{animation:tw 4.6s ease-in-out infinite .8s}
  .tw3{animation:tw 2.6s ease-in-out infinite 1.6s}
  .fl{transform-box:fill-box;transform-origin:50% 100%;animation:fl 1.6s ease-in-out infinite}
  .glow{animation:gl 3.4s ease-in-out infinite}
  .drift{animation:dr 14s ease-in-out infinite alternate}
  .bob{transform-box:fill-box;transform-origin:50% 50%;animation:bob 5s ease-in-out infinite}
  .shim{animation:sh 7s ease-in-out infinite 1s}
  .spin{transform-box:fill-box;transform-origin:50% 50%;animation:spin 40s linear infinite}
  @keyframes tw{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes fl{0%,100%{transform:scale(1,1) rotate(0)}30%{transform:scale(.94,1.07) rotate(-2deg)}65%{transform:scale(1.04,.95) rotate(2deg)}}
  @keyframes gl{0%,100%{opacity:.95}50%{opacity:.7}}
  @keyframes dr{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes sh{0%{transform:translateX(0) skewX(-18deg)}28%,100%{transform:translateX(1000px) skewX(-18deg)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){.tw,.tw2,.tw3,.fl,.glow,.drift,.bob,.shim,.spin{animation:none}.shim{opacity:0}}
</style>"""


def svg(vb_w, vb_h, body, defs="", anim=True, extra_attr=""):
    style = STYLE_ANIM if anim else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}" '
        f'width="{vb_w}" height="{vb_h}" {extra_attr}>'
        f"{style}<defs>{defs}</defs>{body}</svg>\n"
    )


def lin(id_, stops, x1=0, y1=0, x2=0, y2=1):
    s = "".join(
        f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity=\"{a}\""}/>'
        for o, c, a in [(st + (None,))[:3] for st in stops]
    )
    return f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(id_, stops, cx=0.5, cy=0.5, r=0.5, fx=None, fy=None):
    s = "".join(
        f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity=\"{a}\""}/>'
        for o, c, a in [(st + (None,))[:3] for st in stops]
    )
    f = ""
    if fx is not None:
        f = f' fx="{fx}" fy="{fy}"'
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}"{f}>{s}</radialGradient>'


def glow_def(id_, color, inner=0.9):
    return rad(id_, [(0, color, inner), (0.45, color, inner * 0.35), (1, color, 0)])


def stars(seed, n, x0, y0, x1, y1, color="#FFF6D8", rmin=1.2, rmax=3.2, sparkle=0.15):
    rnd = random.Random(seed)
    out = []
    cls = ["tw", "tw2", "tw3", ""]
    for i in range(n):
        x = rnd.uniform(x0, x1)
        y = rnd.uniform(y0, y1)
        r = rnd.uniform(rmin, rmax)
        c = rnd.choice(cls)
        if rnd.random() < sparkle:
            out.append(sparkle_star(x, y, r * 3.2, color, c))
        else:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{color}" class="{c}"/>')
    return "".join(out)


def sparkle_star(x, y, r, color, cls=""):
    k = r * 0.22
    d = (f"M{x:.1f},{y-r:.1f} Q{x+k:.1f},{y-k:.1f} {x+r:.1f},{y:.1f} "
         f"Q{x+k:.1f},{y+k:.1f} {x:.1f},{y+r:.1f} Q{x-k:.1f},{y+k:.1f} {x-r:.1f},{y:.1f} "
         f"Q{x-k:.1f},{y-k:.1f} {x:.1f},{y-r:.1f} Z")
    return f'<path d="{d}" fill="{color}" class="{cls}"/>'


def rays(cx, cy, n, r_in, r_out, width_deg, color, op, rot=0):
    out = []
    for i in range(n):
        a = math.radians(rot + i * 360 / n)
        w = math.radians(width_deg / 2)
        x1 = cx + r_in * math.cos(a - w); y1 = cy + r_in * math.sin(a - w)
        x2 = cx + r_out * math.cos(a - w * 2.2); y2 = cy + r_out * math.sin(a - w * 2.2)
        x3 = cx + r_out * math.cos(a + w * 2.2); y3 = cy + r_out * math.sin(a + w * 2.2)
        x4 = cx + r_in * math.cos(a + w); y4 = cy + r_in * math.sin(a + w)
        out.append(f'<path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f} L{x3:.1f},{y3:.1f} L{x4:.1f},{y4:.1f} Z"/>')
    return f'<g fill="{color}" opacity="{op}">{"".join(out)}</g>'


def dove(x, y, s, color="#FFFFFF", flip=False, cls="bob"):
    """Small flying dove, centred near (x, y)."""
    t = f'translate({x},{y}) scale({-s if flip else s},{s})'
    return (
        f'<g transform="{t}"><g class="{cls}">'
        f'<path d="M-30,6 Q-8,-4 10,2 Q22,-2 30,-8 Q26,4 16,8 Q4,16 -14,14 Q-24,12 -30,6Z" fill="{color}"/>'
        f'<path d="M-6,2 Q-18,-30 6,-40 Q4,-18 12,0Z" fill="{color}" opacity=".92"/>'
        f'<path d="M2,4 Q14,-22 34,-26 Q24,-8 16,6Z" fill="{color}" opacity=".8"/>'
        f'<circle cx="24" cy="-4" r="1.8" fill="#4A3426"/>'
        f'<path d="M30,-6 L37,-4 L30,-2Z" fill="#F4A259"/>'
        f'</g></g>'
    )


def sheep(x, y, s, wool="#FFFFFF", face="#3D3A4A", cls=""):
    """Cute side-ish sheep; (x, y) = centre of the wool body."""
    puffs = [(-40, -6, 26), (-18, -22, 28), (10, -24, 28), (36, -10, 26), (40, 14, 22),
             (14, 22, 26), (-14, 22, 26), (-40, 16, 22), (0, 0, 32)]
    wool_svg = "".join(f'<circle cx="{px}" cy="{py}" r="{pr}"/>' for px, py, pr in puffs)
    return (
        f'<g transform="translate({x},{y}) scale({s})"><g class="{cls}">'
        f'<g fill="{face}"><rect x="-30" y="26" width="9" height="34" rx="4"/><rect x="-10" y="30" width="9" height="32" rx="4"/>'
        f'<rect x="14" y="30" width="9" height="32" rx="4"/><rect x="32" y="26" width="9" height="34" rx="4"/></g>'
        f'<g fill="{wool}">{wool_svg}</g>'
        f'<g fill="#000" opacity=".06"><circle cx="14" cy="22" r="26"/><circle cx="40" cy="14" r="22"/></g>'
        f'<ellipse cx="62" cy="-8" rx="21" ry="25" fill="{face}"/>'
        f'<ellipse cx="44" cy="-22" rx="13" ry="7" fill="{face}" transform="rotate(-25 44 -22)"/>'
        f'<ellipse cx="80" cy="-24" rx="12" ry="6" fill="{face}" transform="rotate(25 80 -24)"/>'
        f'<circle cx="58" cy="-30" r="13" fill="{wool}"/><circle cx="70" cy="-32" r="11" fill="{wool}"/>'
        f'<circle cx="55" cy="-8" r="3.6" fill="#fff"/><circle cx="69" cy="-8" r="3.6" fill="#fff"/>'
        f'<circle cx="55.6" cy="-7.4" r="1.9" fill="#222"/><circle cx="69.6" cy="-7.4" r="1.9" fill="#222"/>'
        f'<path d="M57,6 Q62,10 67,6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
        f'</g></g>'
    )


def flame(x, y, s, outer="#F6A04D", mid="#FFD36E", core="#FFF6D8", cls="fl"):
    """Teardrop flame; (x, y) is the flame base."""
    return (
        f'<g transform="translate({x},{y}) scale({s})"><g class="{cls}">'
        f'<path d="M0,0 C-16,-2 -18,-22 -10,-36 C-6,-44 -2,-52 0,-62 C4,-50 12,-42 15,-30 C19,-16 14,-2 0,0Z" fill="{outer}"/>'
        f'<path d="M0,-2 C-9,-3 -11,-16 -6,-26 C-3,-32 -1,-38 0,-44 C3,-36 8,-30 9,-22 C11,-12 8,-3 0,-2Z" fill="{mid}"/>'
        f'<ellipse cx="0" cy="-10" rx="4.5" ry="8" fill="{core}"/>'
        f'</g></g>'
    )


# --------------------------------------------------------------- figures
def figure(cx, by, s, robe, robe2, skin, hair, style="short", face="kind",
           arms=(), trim=None, stole=None, back=False, hood_col=None):
    """Storybook figure. Returns (body_svg, hands_svg, head_center).

    by = hem line, s = scale (1 => ~290 px tall).
    arms: list of (side, hx, hy) with side 'L' or 'R' and absolute hand pos.
    """
    S = lambda v: v * s
    sh_y = by - S(208)
    hy = by - S(252)
    hr = S(42)
    robe_d = (f"M{cx-S(32):.1f},{sh_y:.1f} C{cx-S(74):.1f},{sh_y+S(6):.1f} {cx-S(80):.1f},{by-S(120):.1f} {cx-S(94):.1f},{by:.1f} "
              f"Q{cx:.1f},{by+S(18):.1f} {cx+S(94):.1f},{by:.1f} "
              f"C{cx+S(80):.1f},{by-S(120):.1f} {cx+S(74):.1f},{sh_y+S(6):.1f} {cx+S(32):.1f},{sh_y:.1f} Z")
    out = [f'<path d="{robe_d}" fill="{robe}"/>']
    # soft fold shading
    out.append(f'<path d="M{cx+S(18):.1f},{sh_y+S(30):.1f} C{cx+S(34):.1f},{by-S(110):.1f} {cx+S(48):.1f},{by-S(40):.1f} {cx+S(62):.1f},{by+S(6):.1f} '
               f'Q{cx+S(84):.1f},{by+S(4):.1f} {cx+S(94):.1f},{by:.1f} C{cx+S(80):.1f},{by-S(120):.1f} {cx+S(74):.1f},{sh_y+S(6):.1f} {cx+S(32):.1f},{sh_y:.1f}Z" fill="{robe2}" opacity=".75"/>')
    out.append(f'<path d="M{cx-S(30):.1f},{by-S(60):.1f} Q{cx-S(36):.1f},{by-S(20):.1f} {cx-S(40):.1f},{by+S(8):.1f}" fill="none" stroke="{robe2}" stroke-width="{S(4):.1f}" stroke-linecap="round" opacity=".6"/>')
    if stole:
        out.append(f'<path d="M{cx-S(26):.1f},{sh_y:.1f} L{cx-S(34):.1f},{by+S(6):.1f} L{cx-S(14):.1f},{by+S(10):.1f} L{cx-S(10):.1f},{sh_y+S(8):.1f}Z" fill="{stole}"/>'
                   f'<path d="M{cx+S(26):.1f},{sh_y:.1f} L{cx+S(34):.1f},{by+S(6):.1f} L{cx+S(14):.1f},{by+S(10):.1f} L{cx+S(10):.1f},{sh_y+S(8):.1f}Z" fill="{stole}"/>')
    if trim:
        out.append(f'<path d="M{cx-S(92):.1f},{by-S(4):.1f} Q{cx:.1f},{by+S(14):.1f} {cx+S(92):.1f},{by-S(4):.1f}" fill="none" stroke="{trim}" stroke-width="{S(7):.1f}"/>')
        out.append(f'<path d="M{cx-S(34):.1f},{sh_y+S(2):.1f} Q{cx:.1f},{sh_y+S(34):.1f} {cx+S(34):.1f},{sh_y+S(2):.1f}" fill="none" stroke="{trim}" stroke-width="{S(7):.1f}" stroke-linecap="round"/>')
    # neck
    if not back:
        out.append(f'<rect x="{cx-S(13):.1f}" y="{hy+S(30):.1f}" width="{S(26):.1f}" height="{S(24):.1f}" rx="{S(8):.1f}" fill="{skin}"/>')
        out.append(f'<path d="M{cx-S(13):.1f},{hy+S(40):.1f} Q{cx:.1f},{hy+S(50):.1f} {cx+S(13):.1f},{hy+S(40):.1f}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="{S(4):.1f}"/>')
    # arms (sleeves) behind hands
    hands = []
    for side, hx, hy_ in arms:
        sx = cx - S(54) if side == "L" else cx + S(54)
        sy = sh_y + S(22)
        ctrl_x = sx + (S(-14) if side == "L" else S(14))
        ctrl_y = (sy + hy_) / 2 + S(26)
        out.append(f'<path d="M{sx:.1f},{sy:.1f} Q{ctrl_x:.1f},{ctrl_y:.1f} {hx:.1f},{hy_:.1f}" fill="none" stroke="{robe}" stroke-width="{S(34):.1f}" stroke-linecap="round"/>')
        out.append(f'<path d="M{sx:.1f},{sy:.1f} Q{ctrl_x:.1f},{ctrl_y:.1f} {hx:.1f},{hy_:.1f}" fill="none" stroke="{robe2}" stroke-width="{S(10):.1f}" stroke-linecap="round" opacity=".35" transform="translate({S(6):.1f},{S(6):.1f})"/>')
        hands.append(f'<circle cx="{hx:.1f}" cy="{hy_:.1f}" r="{S(13):.1f}" fill="{skin}"/>'
                     f'<circle cx="{hx:.1f}" cy="{hy_:.1f}" r="{S(13):.1f}" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="{S(2.5):.1f}"/>')
    # head
    hc = hood_col or robe
    if back:
        # back view: hood covers whole head
        out.append(f'<path d="M{cx-S(48):.1f},{hy+S(44):.1f} C{cx-S(58):.1f},{hy-S(10):.1f} {cx-S(40):.1f},{hy-S(56):.1f} {cx:.1f},{hy-S(58):.1f} '
                   f'C{cx+S(40):.1f},{hy-S(56):.1f} {cx+S(58):.1f},{hy-S(10):.1f} {cx+S(48):.1f},{hy+S(44):.1f} Q{cx:.1f},{hy+S(62):.1f} {cx-S(48):.1f},{hy+S(44):.1f}Z" fill="{hc}"/>')
        out.append(f'<path d="M{cx:.1f},{hy-S(56):.1f} Q{cx+S(6):.1f},{hy:.1f} {cx:.1f},{hy+S(54):.1f}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="{S(4):.1f}"/>')
        return "".join(out), "".join(hands), (cx, hy)
    if style == "hood":
        out.append(f'<path d="M{cx-S(60):.1f},{hy+S(52):.1f} C{cx-S(70):.1f},{hy-S(10):.1f} {cx-S(50):.1f},{hy-S(66):.1f} {cx:.1f},{hy-S(68):.1f} '
                   f'C{cx+S(50):.1f},{hy-S(66):.1f} {cx+S(70):.1f},{hy-S(10):.1f} {cx+S(60):.1f},{hy+S(52):.1f} Q{cx:.1f},{hy+S(70):.1f} {cx-S(60):.1f},{hy+S(52):.1f}Z" fill="{hc}"/>')
    if style == "long":
        out.append(f'<path d="M{cx-S(44):.1f},{hy-S(6):.1f} Q{cx-S(54):.1f},{hy+S(40):.1f} {cx-S(48):.1f},{hy+S(76):.1f} L{cx-S(24):.1f},{hy+S(70):.1f} L{cx-S(28):.1f},{hy+S(10):.1f}Z" fill="{hair}"/>'
                   f'<path d="M{cx+S(44):.1f},{hy-S(6):.1f} Q{cx+S(54):.1f},{hy+S(40):.1f} {cx+S(48):.1f},{hy+S(76):.1f} L{cx+S(24):.1f},{hy+S(70):.1f} L{cx+S(28):.1f},{hy+S(10):.1f}Z" fill="{hair}"/>')
    if style == "bun":
        out.append(f'<circle cx="{cx:.1f}" cy="{hy-S(46):.1f}" r="{S(18):.1f}" fill="{hair}"/>')
    out.append(f'<circle cx="{cx:.1f}" cy="{hy:.1f}" r="{hr:.1f}" fill="{skin}"/>')
    # ears
    out.append(f'<circle cx="{cx-S(41):.1f}" cy="{hy+S(4):.1f}" r="{S(8):.1f}" fill="{skin}"/><circle cx="{cx+S(41):.1f}" cy="{hy+S(4):.1f}" r="{S(8):.1f}" fill="{skin}"/>')
    # hair caps
    if style in ("short", "long", "bun"):
        out.append(f'<path d="M{cx-S(43):.1f},{hy+S(4):.1f} C{cx-S(48):.1f},{hy-S(40):.1f} {cx-S(20):.1f},{hy-S(50):.1f} {cx:.1f},{hy-S(48):.1f} '
                   f'C{cx+S(26):.1f},{hy-S(50):.1f} {cx+S(50):.1f},{hy-S(38):.1f} {cx+S(43):.1f},{hy+S(4):.1f} '
                   f'C{cx+S(36):.1f},{hy-S(16):.1f} {cx+S(20):.1f},{hy-S(22):.1f} {cx+S(6):.1f},{hy-S(20):.1f} '
                   f'Q{cx-S(6):.1f},{hy-S(30):.1f} {cx-S(18):.1f},{hy-S(18):.1f} C{cx-S(30):.1f},{hy-S(16):.1f} {cx-S(38):.1f},{hy-S(8):.1f} {cx-S(43):.1f},{hy+S(4):.1f}Z" fill="{hair}"/>')
    if style == "elder":
        out.append(f'<path d="M{cx-S(44):.1f},{hy+S(10):.1f} C{cx-S(50):.1f},{hy-S(20):.1f} {cx-S(36):.1f},{hy-S(34):.1f} {cx-S(26):.1f},{hy-S(30):.1f} '
                   f'C{cx-S(30):.1f},{hy-S(12):.1f} {cx-S(36):.1f},{hy:.1f} {cx-S(38):.1f},{hy+S(14):.1f}Z" fill="{hair}"/>'
                   f'<path d="M{cx+S(44):.1f},{hy+S(10):.1f} C{cx+S(50):.1f},{hy-S(20):.1f} {cx+S(36):.1f},{hy-S(34):.1f} {cx+S(26):.1f},{hy-S(30):.1f} '
                   f'C{cx+S(30):.1f},{hy-S(12):.1f} {cx+S(36):.1f},{hy:.1f} {cx+S(38):.1f},{hy+S(14):.1f}Z" fill="{hair}"/>')
    if style == "hood":
        # inner shadow of the hood around the face
        out.append(f'<path d="M{cx-S(46):.1f},{hy+S(30):.1f} C{cx-S(52):.1f},{hy-S(18):.1f} {cx-S(30):.1f},{hy-S(50):.1f} {cx:.1f},{hy-S(50):.1f} '
                   f'C{cx+S(30):.1f},{hy-S(50):.1f} {cx+S(52):.1f},{hy-S(18):.1f} {cx+S(46):.1f},{hy+S(30):.1f} '
                   f'C{cx+S(40):.1f},{hy-S(10):.1f} {cx+S(26):.1f},{hy-S(30):.1f} {cx:.1f},{hy-S(30):.1f} C{cx-S(26):.1f},{hy-S(30):.1f} {cx-S(40):.1f},{hy-S(10):.1f} {cx-S(46):.1f},{hy+S(30):.1f}Z" fill="#000" opacity=".28"/>')
    # face
    out.append(face_svg(cx, hy, s, face))
    if style == "elder":
        out.append(f'<path d="M{cx-S(36):.1f},{hy+S(10):.1f} C{cx-S(40):.1f},{hy+S(60):.1f} {cx-S(18):.1f},{hy+S(96):.1f} {cx:.1f},{hy+S(104):.1f} '
                   f'C{cx+S(18):.1f},{hy+S(96):.1f} {cx+S(40):.1f},{hy+S(60):.1f} {cx+S(36):.1f},{hy+S(10):.1f} '
                   f'C{cx+S(26):.1f},{hy+S(26):.1f} {cx+S(14):.1f},{hy+S(20):.1f} {cx:.1f},{hy+S(24):.1f} C{cx-S(14):.1f},{hy+S(20):.1f} {cx-S(26):.1f},{hy+S(26):.1f} {cx-S(36):.1f},{hy+S(10):.1f}Z" fill="{hair}"/>'
                   f'<path d="M{cx-S(10):.1f},{hy+S(30):.1f} Q{cx:.1f},{hy+S(36):.1f} {cx+S(10):.1f},{hy+S(30):.1f}" fill="none" stroke="{P["ink"]}" stroke-width="{S(3):.1f}" stroke-linecap="round" opacity=".55"/>'
                   f'<path d="M{cx-S(22):.1f},{hy+S(20):.1f} Q{cx-S(10):.1f},{hy+S(12):.1f} {cx:.1f},{hy+S(20):.1f} Q{cx+S(10):.1f},{hy+S(12):.1f} {cx+S(22):.1f},{hy+S(20):.1f}" fill="{hair}" stroke="#d8d2c4" stroke-width="{S(1.5):.1f}"/>')
    return "".join(out), "".join(hands), (cx, hy)


def face_svg(cx, hy, s, face):
    S = lambda v: v * s
    ink = "#3B2A22"
    o = []
    if face in ("kind", "happy"):
        o.append(f'<ellipse cx="{cx-S(15):.1f}" cy="{hy+S(2):.1f}" rx="{S(4.6):.1f}" ry="{S(6):.1f}" fill="{ink}"/>'
                 f'<ellipse cx="{cx+S(15):.1f}" cy="{hy+S(2):.1f}" rx="{S(4.6):.1f}" ry="{S(6):.1f}" fill="{ink}"/>'
                 f'<circle cx="{cx-S(13.5):.1f}" cy="{hy-S(0.5):.1f}" r="{S(1.6):.1f}" fill="#fff"/><circle cx="{cx+S(16.5):.1f}" cy="{hy-S(0.5):.1f}" r="{S(1.6):.1f}" fill="#fff"/>')
        w = 11 if face == "kind" else 13
        o.append(f'<path d="M{cx-S(w):.1f},{hy+S(17):.1f} Q{cx:.1f},{hy+S(28):.1f} {cx+S(w):.1f},{hy+S(17):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.4):.1f}" stroke-linecap="round"/>')
    elif face == "calm":
        o.append(f'<path d="M{cx-S(21):.1f},{hy+S(2):.1f} Q{cx-S(15):.1f},{hy+S(8):.1f} {cx-S(9):.1f},{hy+S(2):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.2):.1f}" stroke-linecap="round"/>'
                 f'<path d="M{cx+S(9):.1f},{hy+S(2):.1f} Q{cx+S(15):.1f},{hy+S(8):.1f} {cx+S(21):.1f},{hy+S(2):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.2):.1f}" stroke-linecap="round"/>')
        o.append(f'<path d="M{cx-S(9):.1f},{hy+S(18):.1f} Q{cx:.1f},{hy+S(25):.1f} {cx+S(9):.1f},{hy+S(18):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3):.1f}" stroke-linecap="round"/>')
    elif face == "sly":
        # half-lidded eyes looking to the side and a crooked smile
        for sx in (-15, 15):
            o.append(f'<ellipse cx="{cx+S(sx):.1f}" cy="{hy+S(3):.1f}" rx="{S(6):.1f}" ry="{S(4.6):.1f}" fill="#fff"/>'
                     f'<circle cx="{cx+S(sx+2.5):.1f}" cy="{hy+S(4):.1f}" r="{S(3.4):.1f}" fill="{ink}"/>'
                     f'<path d="M{cx+S(sx-8):.1f},{hy+S(1):.1f} Q{cx+S(sx):.1f},{hy-S(3):.1f} {cx+S(sx+8):.1f},{hy+S(1):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.4):.1f}" stroke-linecap="round"/>')
        o.append(f'<path d="M{cx-S(24):.1f},{hy-S(12):.1f} L{cx-S(8):.1f},{hy-S(8):.1f} M{cx+S(8):.1f},{hy-S(8):.1f} L{cx+S(24):.1f},{hy-S(13):.1f}" stroke="{ink}" stroke-width="{S(3):.1f}" stroke-linecap="round" opacity=".7"/>')
        o.append(f'<path d="M{cx-S(9):.1f},{hy+S(20):.1f} Q{cx+S(3):.1f},{hy+S(27):.1f} {cx+S(13):.1f},{hy+S(15):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.4):.1f}" stroke-linecap="round"/>')
    elif face == "peek":
        o.append(f'<ellipse cx="{cx-S(15):.1f}" cy="{hy+S(3):.1f}" rx="{S(6):.1f}" ry="{S(4.4):.1f}" fill="#fff"/>'
                 f'<circle cx="{cx-S(18):.1f}" cy="{hy+S(3.5):.1f}" r="{S(3.4):.1f}" fill="{ink}"/>'
                 f'<path d="M{cx-S(23):.1f},{hy+S(0):.1f} Q{cx-S(15):.1f},{hy-S(4):.1f} {cx-S(7):.1f},{hy+S(0):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.2):.1f}" stroke-linecap="round"/>')
        o.append(f'<path d="M{cx-S(6):.1f},{hy+S(20):.1f} Q{cx+S(4):.1f},{hy+S(26):.1f} {cx+S(12):.1f},{hy+S(16):.1f}" fill="none" stroke="{ink}" stroke-width="{S(3.2):.1f}" stroke-linecap="round"/>')
    o.append(f'<circle cx="{cx-S(25):.1f}" cy="{hy+S(14):.1f}" r="{S(7):.1f}" fill="{P["blush"]}" opacity=".42"/>'
             f'<circle cx="{cx+S(25):.1f}" cy="{hy+S(14):.1f}" r="{S(7):.1f}" fill="{P["blush"]}" opacity=".42"/>')
    return "".join(o)


# ------------------------------------------------------------ card frame
CARD_W, CARD_H = 600, 840
ART = (30, 30, 540, 650)          # x, y, w, h of the art window
PLATE = (46, 700, 508, 104)       # blank nameplate where the UI renders the role name


ARCH_D = "M30,680 L30,176 C30,86 150,30 300,30 C450,30 570,86 570,176 L570,680 Z"


def _mosaic(p, colors, lead, seed):
    """Stained-glass triangles filling the two spandrels above the arch."""
    rnd = random.Random(seed)
    out = []
    size, hgt = 44, 38
    for row in range(6):
        y0 = 12 + row * hgt
        for col in range(-1, 15):
            x0 = 12 + col * size + (size / 2 if row % 2 else 0)
            for tri in (
                ((x0, y0), (x0 + size, y0), (x0 + size / 2, y0 + hgt)),
                ((x0 + size / 2, y0 + hgt), (x0 + size, y0), (x0 + size * 1.5, y0 + hgt)),
            ):
                c = rnd.choice(colors)
                pts = " ".join(f"{x:.0f},{y:.0f}" for x, y in tri)
                cls = ' class="tw2"' if rnd.random() < 0.035 else ""
                out.append(f'<polygon points="{pts}" fill="{c}"{cls}/>')
    return (f'<g clip-path="url(#{p}spd)" stroke="{lead}" stroke-width="3" stroke-linejoin="round">'
            + "".join(out) + "</g>")


def card(p, team, scene, scene_defs=""):
    """Arched stained-glass card. Art window = ART (top corners arched),
    blank scroll nameplate = PLATE for the UI to write the role name."""
    good = team == "good"
    if good:
        f1, f2, f3 = "#FFEDB3", "#E2A945", "#9C6420"
        edge, line = "#5E3A12", "#FFF4D2"
        plate1, plate2, plate_edge, roll = "#FFF8EA", "#F1DDB2", "#B9832A", "#E3C58C"
        glass = ["#F6C453", "#F4A259", "#8EC5E8", "#7FB07A", "#FFE6A3", "#E58F6B", "#5E9ECF"]
    else:
        f1, f2, f3 = "#DCC8F2", "#7E57A6", "#2E1C44"
        edge, line = "#1E1230", "#EFE4FB"
        plate1, plate2, plate_edge, roll = "#F7F1FD", "#DDCBF0", "#7E57A6", "#C9B2E6"
        glass = ["#7E57A6", "#B48CE0", "#3C5A8A", "#5B3A7A", "#2C8C8C", "#C06C9E", "#4B6BB0"]
    x, y, w, h = ART
    px, py, pw, ph = PLATE
    defs = (
        lin(f"{p}fr", [(0, f1), (0.5, f2), (1, f3)], 0, 0, 1, 1)
        + lin(f"{p}pl", [(0, plate1), (1, plate2)])
        + lin(f"{p}rl", [(0, plate2), (0.5, plate1), (1, roll)], 0, 0, 1, 0)
        + f'<clipPath id="{p}clip"><path d="{ARCH_D}"/></clipPath>'
        + f'<clipPath id="{p}card"><rect width="600" height="840" rx="36"/></clipPath>'
        + f'<clipPath id="{p}spd"><path clip-rule="evenodd" d="M14,14 H586 V214 H14Z M30,214 L30,176 C30,86 150,30 300,30 C450,30 570,86 570,176 L570,214Z"/></clipPath>'
        + lin(f"{p}vig", [(0, "#000", 0), (0.72, "#000", 0), (1, "#000", 0.25)])
        + lin(f"{p}sh", [(0, "#FFFFFF", 0), (0.5, "#FFFFFF", 0.38), (1, "#FFFFFF", 0)], 0, 0, 1, 0)
        + scene_defs
    )
    gem = sun_gem(300, 32, 26, p) if good else moon_gem(300, 32, 26, p)
    pearls = []
    import math as _m
    # pearls along the arch
    for i in range(1, 22):
        t = i / 22
        # cubic bezier halves of the arch
        if t < 0.5:
            u = t * 2
            P0, P1, P2, P3 = (30, 176), (30, 86), (150, 30), (300, 30)
        else:
            u = (t - 0.5) * 2
            P0, P1, P2, P3 = (300, 30), (450, 30), (570, 86), (570, 176)
        bx = (1-u)**3*P0[0] + 3*(1-u)**2*u*P1[0] + 3*(1-u)*u**2*P2[0] + u**3*P3[0]
        by_ = (1-u)**3*P0[1] + 3*(1-u)**2*u*P1[1] + 3*(1-u)*u**2*P2[1] + u**3*P3[1]
        if abs(bx - 300) < 40:
            continue
        pearls.append(f'<circle cx="{bx:.1f}" cy="{by_:.1f}" r="3.4"/>')
    corners = "".join(
        f'<circle cx="{cx_}" cy="{cy_}" r="5" fill="{line}" opacity=".85"/>'
        for cx_, cy_ in [(24, 820), (576, 820)]
    )
    # rolled scroll nameplate
    plate = (
        f'<rect x="{px+14}" y="{py}" width="{pw-28}" height="{ph}" rx="8" fill="url(#{p}pl)" stroke="{plate_edge}" stroke-width="3"/>'
        f'<rect x="{px}" y="{py-6}" width="24" height="{ph+12}" rx="12" fill="url(#{p}rl)" stroke="{plate_edge}" stroke-width="3"/>'
        f'<rect x="{px+pw-24}" y="{py-6}" width="24" height="{ph+12}" rx="12" fill="url(#{p}rl)" stroke="{plate_edge}" stroke-width="3"/>'
        f'<path d="M{px+60},{py+12} H{px+pw-60} M{px+60},{py+ph-12} H{px+pw-60}" stroke="{plate_edge}" stroke-width="2" opacity=".4"/>'
        f'<path d="M{px+44},{py+ph/2} l9,-9 l9,9 l-9,9z M{px+pw-44},{py+ph/2} l-9,-9 l-9,9 l9,9z" fill="{plate_edge}" opacity=".8"/>'
    )
    body = (
        f'<rect width="600" height="840" rx="36" fill="url(#{p}fr)"/>'
        f'{_mosaic(p, glass, edge, 7 if good else 9)}'
        f'<rect x="10" y="10" width="580" height="820" rx="28" fill="none" stroke="{line}" stroke-width="3" opacity=".75"/>'
        f'<path d="{ARCH_D}" fill="none" stroke="{edge}" stroke-width="14" stroke-linejoin="round"/>'
        f'<g clip-path="url(#{p}clip)">{scene}<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#{p}vig)"/></g>'
        f'<path d="{ARCH_D}" fill="none" stroke="{f1}" stroke-width="4" stroke-linejoin="round"/>'
        f'<path d="M36,674 L36,177 C36,92 154,37 300,37 C446,37 564,92 564,177 L564,674" fill="none" stroke="{line}" stroke-width="1.5" opacity=".6"/>'
        f'<g fill="{line}">{"".join(pearls)}</g>'
        f'{plate}{corners}{gem}'
        f'<g clip-path="url(#{p}card)" opacity=".9"><rect class="shim" x="-260" y="-100" width="200" height="1100" fill="url(#{p}sh)" transform-origin="0 0"/></g>'
    )
    return svg(CARD_W, CARD_H, body, defs)


def sun_gem(cx, cy, r, p):
    return (
        f'<g>{rays(cx, cy, 12, r*0.9, r*1.55, 9, "#FFF1C4", 0.95)}'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#7A4D16"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r-5}" fill="#F6C453"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r-12}" fill="#FFF0BE"/></g>'
    )


def moon_gem(cx, cy, r, p):
    return (
        f'<g><circle cx="{cx}" cy="{cy}" r="{r+6}" fill="#EFE4FB" opacity=".5"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#26173A"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r-5}" fill="#4B2E6B"/>'
        f'<path d="M{cx+4},{cy-15} A15,15 0 1,0 {cx+4},{cy+15} A11,11 0 1,1 {cx+4},{cy-15}Z" fill="#F3E9C6"/>'
        f'{sparkle_star(cx+12, cy-6, 5, "#F3E9C6")}</g>'
    )


def hills(layers):
    """layers: list of (path_d, fill, opacity)."""
    return "".join(f'<path d="{d}" fill="{c}" opacity="{o}"/>' for d, c, o in layers)
