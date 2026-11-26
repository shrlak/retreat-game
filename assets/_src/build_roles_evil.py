"""Evil-team (유혹의 무리) role cards for 빛의 원정대.

Writes into ../roles/:
  assassin.svg  정탐꾼            (ras_)
  morgana.svg   거짓 선지자       (rmo_)
  mordred.svg   양의 탈을 쓴 늑대 (rmd_)
  oberon.svg    방황하는 자       (rob_)
  minion.svg    유혹하는 자       (rmi_)

Mischievous and cheeky, never scary. No text in the art.
Run from _src:  python3 build_roles_evil.py
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import P, card, figure, stars, flame, sheep, sparkle_star, glow_def, rad, lin  # noqa: E402

OUT = os.path.normpath(os.path.join(HERE, "..", "roles"))

X0, Y0, X1, Y1 = 30, 30, 570, 680  # art window


def bg(p, top, mid, bot):
    return (lin(f"{p}sky", [(0, top), (0.55, mid), (1, bot)]),
            f'<rect x="{X0}" y="{Y0}" width="540" height="650" fill="url(#{p}sky)"/>')


def glow(id_, cx, cy, r, cls="glow"):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{id_})" class="{cls}"/>'


# ===================================================================== 정탐꾼
def assassin():
    p = "ras_"
    d_sky, sky = bg(p, "#121A36", "#24346A", "#3A3C78")
    defs = d_sky
    defs += glow_def(f"{p}mglow", "#F3E9C6", 0.55)
    defs += glow_def(f"{p}rim", "#B9C4FF", 0.45)
    defs += glow_def(f"{p}glint", "#FFF3C4", 1)
    defs += lin(f"{p}rock", [(0, "#6E6A93"), (0.5, "#4D4972"), (1, "#2E2B4C")], 0, 0, 0.3, 1)
    defs += lin(f"{p}brass", [(0, "#FBE3A0"), (0.45, "#E2A945"), (1, "#8A5A1C")], 0, 0, 0, 1)
    defs += lin(f"{p}hill", [(0, "#253064"), (1, "#151C3A")])
    s = [sky]
    # moon + stars
    s.append(glow(f"{p}mglow", 150, 150, 170))
    s.append('<circle cx="150" cy="150" r="58" fill="#F6EED2"/>'
             '<circle cx="132" cy="138" r="9" fill="#E7DDB8"/><circle cx="168" cy="170" r="12" fill="#E7DDB8"/>'
             '<circle cx="160" cy="124" r="5" fill="#E7DDB8"/>')
    s.append(stars(11, 46, 40, 40, 560, 330, rmin=1.2, rmax=2.8, sparkle=0.18))
    # far hills
    s.append(f'<path d="M30,420 Q140,360 260,400 T470,380 T570,390 V680 H30Z" fill="url(#{p}hill)" opacity=".9"/>')
    # cypress silhouettes
    def cypress(x, base, h, w, col):
        return (f'<path d="M{x},{base-h} C{x+w*0.55},{base-h*0.7} {x+w*0.62},{base-h*0.25} {x+w*0.35},{base} '
                f'L{x-w*0.35},{base} C{x-w*0.62},{base-h*0.25} {x-w*0.55},{base-h*0.7} {x},{base-h}Z" fill="{col}"/>')
    s.append(cypress(70, 470, 260, 70, "#1A2350"))
    s.append(cypress(120, 470, 190, 56, "#1F2A5C"))
    s.append(cypress(495, 470, 290, 78, "#18204A"))
    s.append(cypress(548, 470, 210, 58, "#1E285A"))
    s.append(cypress(445, 470, 150, 44, "#202C60"))
    # rim-light halo behind the spy
    s.append(glow(f"{p}rim", 300, 400, 210))
    # the spy (head and shoulders above the rock)
    sc = 1.6
    cx, hy_target = 290, 392
    by = hy_target + 252 * sc
    robe, robe2 = "#3E4596", "#2A2F6E"
    body, hands, (hx, hy) = figure(cx, by, sc, robe, robe2, P["skin2"], "#3B2A22", "hood", "peek",
                                   arms=[("L", 168, 534), ("R", 420, 404)], hood_col="#4A52A8")
    s.append(body)
    # cheeky grin over the small peek mouth
    S = lambda v: v * sc
    s.append(f'<path d="M{hx-S(12):.1f},{hy+S(17):.1f} Q{hx+S(4):.1f},{hy+S(32):.1f} {hx+S(18):.1f},{hy+S(14):.1f} Z" fill="#7A2E2E"/>'
             f'<path d="M{hx-S(9):.1f},{hy+S(18):.1f} L{hx+S(15):.1f},{hy+S(16):.1f} L{hx+S(13):.1f},{hy+S(20):.1f} L{hx-S(6):.1f},{hy+S(21):.1f}Z" fill="#fff"/>')
    # cheeky raised brow over the open eye
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
    for t in (30, 110):
        s.append(seg(t, t + 6, 16 if t < 70 else 21, 16 if t < 70 else 21, "#F8DC8B"))
    lx, ly = pt(216)
    s.append(f'<ellipse cx="{lx:.1f}" cy="{ly:.1f}" rx="10" ry="31" transform="rotate(-20 {lx:.1f} {ly:.1f})" fill="#9FD3F2"/>'
             f'<ellipse cx="{lx+2:.1f}" cy="{ly-8:.1f}" rx="4" ry="11" transform="rotate(-20 {lx:.1f} {ly:.1f})" fill="#fff" opacity=".85"/>')
    s.append(glow(f"{p}glint", round(lx + 6), round(ly - 6), 46))
    s.append(sparkle_star(lx + 8, ly - 10, 26, "#FFF8DC", "tw"))
    s.append(sparkle_star(lx + 34, ly - 40, 9, "#FFF8DC", "tw3"))
    # the big rock in front
    s.append(f'<path d="M30,560 C40,520 90,500 150,508 C200,490 250,500 300,512 C360,500 420,488 480,506 C530,512 562,540 570,570 V680 H30Z" fill="url(#{p}rock)"/>')
    s.append('<path d="M60,540 C110,520 170,520 220,526" fill="none" stroke="#8C88B5" stroke-width="7" stroke-linecap="round" opacity=".55"/>'
             '<path d="M360,522 C410,510 460,512 510,526" fill="none" stroke="#8C88B5" stroke-width="7" stroke-linecap="round" opacity=".5"/>'
             '<path d="M120,600 Q180,590 230,610 M340,620 Q400,600 470,612" fill="none" stroke="#25223F" stroke-width="5" stroke-linecap="round" opacity=".55"/>')
    # moss tufts
    s.append('<g fill="#3F6B5C"><ellipse cx="420" cy="508" rx="34" ry="9"/><ellipse cx="100" cy="520" rx="28" ry="8"/></g>')
    s.append(hands)
    # tiny fingers curled over the rock edge
    s.append(f'<g fill="{P["skin2"]}"><circle cx="156" cy="546" r="7"/><circle cx="170" cy="549" r="7"/><circle cx="184" cy="546" r="7"/></g>')
    # grass in front
    s.append('<g fill="#1C3A3A">' + "".join(
        f'<path d="M{x},680 Q{x+6},{650-(x*7)%30} {x+12},680Z"/>' for x in range(30, 570, 22)) + '</g>')
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
    defs += lin(f"{p}glass", [(0, "#4B2E6B"), (1, "#2A1844")])
    s = [sky]
    # big pale moon
    s.append(glow(f"{p}moon", 380, 210, 230))
    s.append('<circle cx="380" cy="210" r="118" fill="#EEE6FA"/>'
             '<circle cx="345" cy="180" r="16" fill="#DDD1F0"/><circle cx="420" cy="250" r="22" fill="#DDD1F0"/>'
             '<circle cx="410" cy="160" r="9" fill="#DDD1F0"/>')
    s.append(stars(21, 34, 40, 40, 560, 380, color="#F3E8FF", rmin=1.2, rmax=2.6, sparkle=0.2))
    # distant hills
    s.append('<path d="M30,560 Q150,500 290,540 T570,520 V680 H30Z" fill="#3A2550" opacity=".85"/>'
             '<path d="M30,610 Q200,570 340,600 T570,590 V680 H30Z" fill="#2A1844"/>')
    # prophet
    sc = 1.28
    cx = 316
    hy_t = 330
    by = hy_t + 252 * sc
    hair = "#D8D0EE"
    body, hands, (hx, hy) = figure(cx, by, sc, "#5B3A7A", "#3A2550", P["skin1"], hair, "long", "sly",
                                   arms=[("L", 168, 470), ("R", 470, 520)], trim=P["gold"], stole="#7E57A6")
    # hair highlight drawn on top later; body first
    s.append(body)
    S = lambda v: v * sc
    s.append(f'<path d="M{hx-S(30):.1f},{hy-S(28):.1f} Q{hx-S(8):.1f},{hy-S(44):.1f} {hx+S(14):.1f},{hy-S(36):.1f}" fill="none" stroke="#fff" stroke-width="{S(4):.1f}" stroke-linecap="round" opacity=".6"/>')
    # gold brooch
    s.append(f'<circle cx="{hx:.1f}" cy="{hy+S(84):.1f}" r="{S(9):.1f}" fill="{P["gold"]}"/><circle cx="{hx:.1f}" cy="{hy+S(84):.1f}" r="{S(4):.1f}" fill="#B48CE0"/>')
    # --- mask on a stick (left of face)
    mx, my = 150, 318
    s.append(glow(f"{p}gold", mx, my - 20, 120))
    s.append(f'<path d="M{mx+6},{my+60} Q{mx+16},{my+110} 170,462" fill="none" stroke="#8A5A1C" stroke-width="9" stroke-linecap="round"/>')
    s.append(f'<path d="M{mx+6},{my+60} Q{mx+16},{my+110} 170,462" fill="none" stroke="#F8DC8B" stroke-width="3" stroke-linecap="round" opacity=".7"/>')
    # fake halo ring on a little wire
    s.append(f'<path d="M{mx},{my-62} V{my-84}" stroke="#B9832A" stroke-width="3"/>')
    s.append(f'<ellipse cx="{mx}" cy="{my-92}" rx="44" ry="12" fill="none" stroke="#FFE38A" stroke-width="7" class="glow"/>')
    s.append(f'<ellipse cx="{mx}" cy="{my-92}" rx="44" ry="12" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>')
    # mask face (sweet holy smile)
    s.append(f'<path d="M{mx-58},{my-30} C{mx-62},{my-70} {mx+62},{my-70} {mx+58},{my-30} C{mx+56},{my+20} {mx+30},{my+66} {mx},{my+68} '
             f'C{mx-30},{my+66} {mx-56},{my+20} {mx-58},{my-30}Z" fill="url(#{p}mask)" stroke="#B9832A" stroke-width="4"/>')
    # side flourishes
    s.append(f'<path d="M{mx-58},{my-30} q-26,-10 -30,-34 q16,10 30,6" fill="#F2C65A" stroke="#B9832A" stroke-width="3"/>'
             f'<path d="M{mx+58},{my-30} q26,-10 30,-34 q-16,10 -30,6" fill="#F2C65A" stroke="#B9832A" stroke-width="3"/>')
    # closed blissful eyes, rosy cheeks, sweet smile
    s.append(f'<g fill="none" stroke="#7A4D16" stroke-width="5" stroke-linecap="round">'
             f'<path d="M{mx-36},{my-14} Q{mx-22},{my-28} {mx-8},{my-14}"/><path d="M{mx+8},{my-14} Q{mx+22},{my-28} {mx+36},{my-14}"/>'
             f'<path d="M{mx-24},{my+22} Q{mx},{my+46} {mx+24},{my+22}"/></g>')
    s.append(f'<circle cx="{mx-36}" cy="{my+10}" r="10" fill="#F28B82" opacity=".55"/><circle cx="{mx+36}" cy="{my+10}" r="10" fill="#F28B82" opacity=".55"/>')
    s.append(f'<path d="M{mx-30},{my-44} Q{mx-6},{my-56} {mx+18},{my-48}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>')
    s.append(sparkle_star(mx + 46, my - 50, 12, "#FFF8DC", "tw"))
    # --- lamp with cold violet flame (right)
    lx, ly = 470, 520
    s.append(glow(f"{p}vio", lx, ly - 70, 140))
    s.append(f'<path d="M{lx-14},{ly-6} Q{lx},{ly-24} {lx+14},{ly-6}" fill="none" stroke="#B9832A" stroke-width="5"/>')  # handle loop above hand
    s.append(f'<path d="M{lx-36},{ly-30} H{lx+36} L{lx+28},{ly-46} H{lx-28}Z" fill="{P["gold"]}"/>')  # top cap
    s.append(f'<path d="M{lx-30},{ly-30} V{ly-110}" stroke="{P["gold_d"]}" stroke-width="0"/>')
    s.append(f'<rect x="{lx-30}" y="{ly-130}" width="60" height="100" rx="10" fill="url(#{p}glass)" opacity=".55" stroke="{P["gold"]}" stroke-width="6"/>')
    s.append(flame(lx, ly - 44, 1.05, outer="#8D5BFF", mid="#C3A2FF", core="#F2EAFF"))
    s.append(f'<path d="M{lx-38},{ly-130} H{lx+38} L{lx+20},{ly-152} H{lx-20}Z" fill="{P["gold"]}"/>'
             f'<circle cx="{lx}" cy="{ly-160}" r="9" fill="none" stroke="{P["gold"]}" stroke-width="5"/>')
    s.append(f'<path d="M{lx-34},{ly-30} Q{lx},{ly-6} {lx+34},{ly-30}Z" fill="{P["gold_d"]}"/>')
    s.append(hands)
    # lilac sparkles
    for (x, y, r, c) in [(80, 120, 14, "tw"), (520, 360, 12, "tw2"), (250, 120, 9, "tw3"), (540, 120, 16, "tw"),
                         (90, 520, 11, "tw2"), (520, 600, 9, "tw3"), (230, 600, 8, "tw")]:
        s.append(sparkle_star(x, y, r, P["lilac"] if r < 12 else "#E4D6F5", c))
    return p, "".join(s), defs


# ===================================================================== 양의 탈을 쓴 늑대
def mordred():
    p = "rmd_"
    d_sky, sky = bg(p, "#3A2550", "#9B5C8C", "#F4A46B")
    defs = d_sky
    defs += glow_def(f"{p}sun", "#FFD9A0", 0.8)
    defs += lin(f"{p}field", [(0, "#5E7A52"), (1, "#2F4A3C")])
    defs += rad(f"{p}wool", [(0, "#FFFFFF"), (0.7, "#F4EEF8"), (1, "#D9CFE6")], 0.45, 0.4, 0.6)
    defs += lin(f"{p}fur", [(0, "#A7A3B3"), (1, "#7A7688")])
    s = [sky]
    s.append(glow(f"{p}sun", 300, 470, 260))
    s.append(stars(31, 18, 40, 40, 560, 190, color="#FFF1D6", rmin=1, rmax=2.4, sparkle=0.25))
    s.append('<path d="M470,92 A30,30 0 1,0 470,152 A23,23 0 1,1 470,92Z" fill="#FFF1D6"/>')
    # hills
    s.append('<path d="M30,440 Q170,390 300,430 T570,410 V680 H30Z" fill="#7C6A86" opacity=".7"/>')
    s.append(f'<path d="M30,480 Q200,440 340,470 T570,460 V680 H30Z" fill="url(#{p}field)"/>')
    # fence
    fence = ['<g>']
    fence.append('<rect x="30" y="472" width="540" height="12" rx="5" fill="#8A6347"/>'
                 '<rect x="30" y="506" width="540" height="12" rx="5" fill="#7A5640"/>')
    for x in range(52, 570, 70):
        fence.append(f'<rect x="{x}" y="450" width="18" height="96" rx="6" fill="#9B7253"/>'
                     f'<path d="M{x},{458} l9,-10 l9,10z" fill="#9B7253"/>')
    fence.append('</g>')
    s.append("".join(fence))
    # puzzled little sheep (left, looking at the wolf)
    s.append(f'<g transform="rotate(-8 112 540)">{sheep(104, 540, 0.62, face="#4A4458")}</g>')
    # puzzled brow + tiny sweat drop
    s.append('<path d="M134,507 l12,-6" stroke="#2A2333" stroke-width="3" stroke-linecap="round"/>'
             '<path d="M166,486 q6,10 0,14 q-6,-4 0,-14z" fill="#BFE3FF"/>')
    # ---------------- the wolf
    W = "url(#" + p + "fur)"
    cx = 330
    # bushy tail sticking out behind (right)
    s.append(f'<path d="M420,560 C500,560 540,500 520,440 C540,470 548,520 520,560 C552,540 560,500 556,480 C570,540 520,600 440,600Z" fill="{W}"/>'
             '<path d="M520,440 C530,455 536,470 538,488 C528,470 522,456 520,440Z" fill="#EDE8F2"/>')
    # feet (grey paws below the wool)
    for fx in (cx - 60, cx + 60):
        s.append(f'<ellipse cx="{fx}" cy="660" rx="40" ry="22" fill="{W}"/>'
                 f'<g fill="#5B5768"><circle cx="{fx-18}" cy="672" r="5"/><circle cx="{fx}" cy="676" r="5"/><circle cx="{fx+18}" cy="672" r="5"/></g>')
    # wool body
    puffs = [(-120, 0, 58), (-90, -60, 60), (-30, -84, 62), (40, -86, 62), (100, -56, 60), (124, 4, 58),
             (104, 66, 56), (40, 92, 58), (-34, 94, 58), (-100, 64, 56), (0, 0, 100)]
    by0 = 540
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{cx+px}" cy="{by0+py}" r="{pr}"/>' for px, py, pr in puffs) + '</g>')
    s.append(f'<g fill="#C9BEDA" opacity=".45">' + "".join(
        f'<circle cx="{cx+px+10}" cy="{by0+py+12}" r="{pr*0.35:.0f}"/>' for px, py, pr in puffs[:-1]) + '</g>')
    # costume zipper/button line (little buttons)
    s.append(f'<g fill="#B48CE0"><circle cx="{cx}" cy="{by0-20}" r="7"/><circle cx="{cx}" cy="{by0+16}" r="7"/><circle cx="{cx}" cy="{by0+52}" r="7"/></g>')
    # paws poking out of the sleeves; left one raised to cover a giggle? no - holding the hood string
    s.append(f'<ellipse cx="{cx-150}" cy="{by0+30}" rx="30" ry="26" fill="{W}"/>'
             f'<g fill="#5B5768"><circle cx="{cx-168}" cy="{by0+40}" r="4.5"/><circle cx="{cx-156}" cy="{by0+50}" r="4.5"/></g>')
    s.append(f'<ellipse cx="{cx+150}" cy="{by0+24}" rx="30" ry="26" fill="{W}"/>'
             f'<g fill="#5B5768"><circle cx="{cx+168}" cy="{by0+34}" r="4.5"/><circle cx="{cx+156}" cy="{by0+44}" r="4.5"/></g>')
    # head
    hx, hy = cx, 300
    # pointy wolf ears poking through the hood
    for sgn in (-1, 1):
        ex = hx + sgn * 62
        s.append(f'<path d="M{ex-sgn*34},{hy-92} L{ex+sgn*14},{hy-190} L{ex+sgn*40},{hy-78}Z" fill="{W}"/>'
                 f'<path d="M{ex-sgn*16},{hy-96} L{ex+sgn*12},{hy-160} L{ex+sgn*26},{hy-92}Z" fill="#E7A9B8"/>')
    # wool hood
    hood = [(-110, -10, 46), (-96, -70, 46), (-50, -110, 48), (0, -122, 48), (50, -110, 48), (96, -70, 46),
            (110, -10, 46), (100, 50, 42), (-100, 50, 42), (0, -20, 112)]
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{hx+px}" cy="{hy+py}" r="{pr}"/>' for px, py, pr in hood) + '</g>')
    # little sheep ears on the hood (floppy, sideways)
    s.append(f'<ellipse cx="{hx-150}" cy="{hy-20}" rx="36" ry="16" transform="rotate(-20 {hx-150} {hy-20})" fill="#4A4458"/>'
             f'<ellipse cx="{hx-150}" cy="{hy-20}" rx="22" ry="8" transform="rotate(-20 {hx-150} {hy-20})" fill="#E7A9B8"/>'
             f'<ellipse cx="{hx+150}" cy="{hy-20}" rx="36" ry="16" transform="rotate(20 {hx+150} {hy-20})" fill="#4A4458"/>'
             f'<ellipse cx="{hx+150}" cy="{hy-20}" rx="22" ry="8" transform="rotate(20 {hx+150} {hy-20})" fill="#E7A9B8"/>')
    # wolf face in the hood opening
    s.append(f'<ellipse cx="{hx}" cy="{hy+8}" rx="84" ry="80" fill="{W}"/>')
    s.append(f'<path d="M{hx-84},{hy+20} Q{hx-60},{hy+70} {hx-20},{hy+86} L{hx-40},{hy+40}Z M{hx+84},{hy+20} Q{hx+60},{hy+70} {hx+20},{hy+86} L{hx+40},{hy+40}Z" fill="#E9E4EE"/>')
    # fluffy hood rim over forehead
    s.append(f'<g fill="url(#{p}wool)">' + "".join(
        f'<circle cx="{hx+px}" cy="{hy+py}" r="{pr}"/>' for px, py, pr in
        [(-70, -54, 28), (-36, -70, 30), (0, -76, 30), (36, -70, 30), (70, -54, 28), (-88, -18, 22), (88, -18, 22)]) + '</g>')
    # muzzle
    s.append(f'<ellipse cx="{hx}" cy="{hy+48}" rx="52" ry="38" fill="#ECE7F0"/>')
    s.append(f'<path d="M{hx-20},{hy+22} Q{hx},{hy+12} {hx+20},{hy+22} Q{hx+14},{hy+38} {hx},{hy+40} Q{hx-14},{hy+38} {hx-20},{hy+22}Z" fill="#2E2A38"/>'
             f'<ellipse cx="{hx-6}" cy="{hy+22}" rx="6" ry="3" fill="#fff" opacity=".6"/>')
    # cheeky grin with one tiny tooth
    s.append(f'<path d="M{hx-36},{hy+54} Q{hx-10},{hy+82} {hx+40},{hy+48}" fill="none" stroke="#2E2A38" stroke-width="5" stroke-linecap="round"/>'
             f'<path d="M{hx},{hy+40} V{hy+60}" stroke="#2E2A38" stroke-width="4" stroke-linecap="round"/>'
             f'<path d="M{hx+12},{hy+67} L{hx+18},{hy+80} L{hx+24},{hy+63}Z" fill="#fff" stroke="#2E2A38" stroke-width="1.5" stroke-linejoin="round"/>')
    # amber half-lidded sly eyes
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 34, hy - 8
        s.append(f'<ellipse cx="{ex}" cy="{ey}" rx="21" ry="16" fill="#FFC94D"/>'
                 f'<circle cx="{ex+sgn*4-6}" cy="{ey+4}" r="8" fill="#2E2A38"/>'
                 f'<circle cx="{ex+sgn*4-9}" cy="{ey+1}" r="2.6" fill="#fff"/>'
                 f'<path d="M{ex-24},{ey-1} Q{ex},{ey-22} {ex+24},{ey-1} L{ex+24},{ey-20} L{ex-24},{ey-20}Z" fill="#8F8B9C"/>'
                 f'<path d="M{ex-24},{ey-1} Q{ex},{ey-8} {ex+24},{ey-1}" fill="none" stroke="#2E2A38" stroke-width="4.5" stroke-linecap="round"/>')
    # sly eyebrows
    s.append(f'<path d="M{hx-58},{hy-38} L{hx-16},{hy-28} M{hx+16},{hy-28} L{hx+58},{hy-40}" stroke="#5B5768" stroke-width="7" stroke-linecap="round"/>')
    # blush
    s.append(f'<circle cx="{hx-58}" cy="{hy+30}" r="11" fill="#F28B82" opacity=".45"/><circle cx="{hx+58}" cy="{hy+30}" r="11" fill="#F28B82" opacity=".45"/>')
    # little sparkles of mischief
    s.append(sparkle_star(150, 300, 14, "#FFF1D6", "tw"))
    s.append(sparkle_star(520, 280, 10, "#FFF1D6", "tw2"))
    # grass tufts foreground
    s.append('<g fill="#2B4636">' + "".join(
        f'<path d="M{x},680 Q{x+5},{652-(x*5)%22} {x+10},680Z"/>' for x in range(30, 570, 18)) + '</g>')
    return p, "".join(s), defs


# ===================================================================== 방황하는 자
def oberon():
    p = "rob_"
    d_sky, sky = bg(p, "#141B33", "#2C3E6B", "#7D8FB8")
    defs = d_sky
    defs += lin(f"{p}path", [(0, "#DCE3F2", 0.95), (1, "#A8B3C9", 0.7)])
    defs += lin(f"{p}fog", [(0, "#C9D3EA", 0), (0.5, "#C9D3EA", 0.55), (1, "#C9D3EA", 0)], 0, 0, 1, 0)
    defs += glow_def(f"{p}hz", "#D7E0F5", 0.6)
    s = [sky]
    s.append(stars(41, 40, 40, 40, 560, 300, color="#E9EEFA", rmin=1, rmax=2.4, sparkle=0.12))
    s.append('<path d="M120,96 A26,26 0 1,0 120,148 A20,20 0 1,1 120,96Z" fill="#E9EEFA" opacity=".9"/>')
    s.append(glow(f"{p}hz", 330, 360, 200))
    # layered mountains
    s.append('<path d="M30,380 L110,300 L170,350 L250,260 L340,350 L420,280 L500,340 L570,300 V680 H30Z" fill="#5E6F9C" opacity=".75"/>')
    s.append(f'<rect x="30" y="330" width="540" height="60" fill="url(#{p}fog)" class="drift"/>')
    s.append('<path d="M30,430 L90,380 L180,430 L280,350 L380,430 L470,370 L570,420 V680 H30Z" fill="#3F5080"/>')
    s.append(f'<rect x="-10" y="410" width="620" height="54" fill="url(#{p}fog)" class="drift" style="animation-delay:-5s"/>')
    s.append('<path d="M30,500 Q150,450 280,480 T570,470 V680 H30Z" fill="#2A3762"/>')
    s.append('<path d="M30,580 Q180,540 330,570 T570,560 V680 H30Z" fill="#1E2A4A"/>')
    # winding pale path from foreground to horizon
    s.append(f'<path d="M210,680 C260,620 420,610 380,560 C350,520 250,520 300,488 C330,468 360,462 352,446 '
             f'L360,446 C374,462 350,476 322,490 C282,516 386,524 420,560 C470,612 360,640 400,680Z" fill="url(#{p}path)"/>')
    # signpost (left foreground) with blank boards
    sx = 130
    s.append(f'<rect x="{sx-8}" y="470" width="16" height="210" rx="5" fill="#6B5446"/>')
    s.append(f'<path d="M{sx-6},492 H{sx+86} L{sx+104},510 L{sx+86},528 H{sx-6}Z" fill="#A6836A"/>')
    s.append(f'<path d="M{sx+6},540 H{sx-80} L{sx-98},558 L{sx-80},576 H{sx+6}Z" fill="#94735C"/>')
    s.append(f'<g transform="rotate(-18 {sx} 600)"><path d="M{sx-4},590 H{sx+70} L{sx+86},604 L{sx+70},618 H{sx-4}Z" fill="#8A6A55"/></g>')
    s.append(f'<path d="M{sx},482 l-7,-14 h14z" fill="#6B5446"/>')
    s.append(f'<g stroke="#5A4538" stroke-width="2" opacity=".5"><path d="M{sx+4},504 H{sx+80}"/><path d="M{sx-4},552 H{sx-76}"/></g>')
    # the lone wanderer, seen from behind, on the path
    sc = 0.62
    cx, by = 352, 600
    robe, robe2 = "#55618C", "#3A4570"
    body, hands, _ = figure(cx, by, sc, robe, robe2, P["skin2"], "#3B2A22", back=True,
                            arms=[("L", cx - 52, by - 92), ("R", cx + 50, by - 100)], hood_col="#606C99")
    s.append(f'<ellipse cx="{cx}" cy="{by+6}" rx="64" ry="9" fill="#000" opacity=".18"/>')
    # walking stick (left hand)
    s.append(f'<path d="M{cx-48},{by-150} L{cx-66},{by+8}" stroke="#7A5C46" stroke-width="7" stroke-linecap="round"/>')
    s.append(body)
    # unlit lantern hanging from right hand
    lx, ly = cx + 54, by - 100
    s.append(f'<path d="M{lx},{ly} V{ly+14}" stroke="#3A3F55" stroke-width="3"/>'
             f'<path d="M{lx-14},{ly+14} H{lx+14} L{lx+10},{ly+8} H{lx-10}Z" fill="#4A4F66"/>'
             f'<rect x="{lx-12}" y="{ly+14}" width="24" height="32" rx="4" fill="#2C3450" stroke="#4A4F66" stroke-width="3"/>'
             f'<path d="M{lx},{ly+16} V{ly+44}" stroke="#4A4F66" stroke-width="2"/>'
             f'<path d="M{lx-6},{ly+38} h12" stroke="#6B7290" stroke-width="3" stroke-linecap="round"/>'
             f'<path d="M{lx-15},{ly+46} H{lx+15} L{lx+11},{ly+52} H{lx-11}Z" fill="#4A4F66"/>')
    s.append(hands)
    # foreground fog bands
    s.append(f'<rect x="-20" y="560" width="640" height="50" fill="url(#{p}fog)" class="drift" style="animation-delay:-9s"/>')
    s.append(f'<rect x="-20" y="625" width="640" height="46" fill="url(#{p}fog)" class="drift" style="animation-delay:-2s" opacity=".8"/>')
    return p, "".join(s), defs


# ===================================================================== 유혹하는 자
def minion():
    p = "rmi_"
    d_sky, sky = bg(p, "#2A1844", "#7E4F8C", "#F28B6B")
    defs = d_sky
    defs += ('<linearGradient id="rmi_snake" gradientUnits="userSpaceOnUse" x1="180" y1="300" x2="420" y2="560">'
             '<stop offset="0" stop-color="#5FBF6A"/><stop offset="0.55" stop-color="#4FA078"/><stop offset="1" stop-color="#8A5BC4"/></linearGradient>')
    defs += ('<linearGradient id="rmi_head" gradientUnits="userSpaceOnUse" x1="300" y1="390" x2="360" y2="530">'
             '<stop offset="0" stop-color="#7BCB72"/><stop offset="1" stop-color="#8E62C6"/></linearGradient>')
    defs += rad(f"{p}apple", [(0, "#FF8A7A"), (0.55, "#E23B3B"), (1, "#A61E30")], 0.38, 0.35, 0.65)
    defs += glow_def(f"{p}ag", "#FFB39A", 0.7)
    defs += lin(f"{p}bark", [(0, "#7A5340"), (1, "#4E3326")], 0, 0, 1, 0)
    s = [sky]
    s.append(stars(51, 14, 40, 40, 560, 200, color="#FFE9D6", rmin=1, rmax=2.2, sparkle=0.3))
    # garden ground
    s.append('<path d="M30,560 Q200,520 330,550 T570,540 V680 H30Z" fill="#3C5A4E"/>'
             '<path d="M30,620 Q220,590 360,615 T570,605 V680 H30Z" fill="#2F4A40"/>')
    # bushes / flowers in the back
    for (x, y, r) in [(470, 560, 50), (530, 545, 40), (420, 575, 38)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#355246"/>')
    for (x, y) in [(460, 540), (510, 528), (430, 560), (60, 600), (95, 590)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="6" fill="#F6B6D0"/><circle cx="{x}" cy="{y}" r="2.5" fill="#FFE38A"/>')
    # trunk
    s.append(f'<path d="M70,680 C90,560 80,420 100,300 L150,290 C150,420 150,560 170,680Z" fill="url(#{p}bark)"/>')
    # canopy
    leaves = [(40, 80, 80), (130, 50, 90), (240, 40, 90), (350, 45, 90), (460, 55, 90), (560, 90, 80),
              (80, 180, 80), (200, 150, 80), (330, 150, 80), (460, 160, 80), (560, 200, 70), (120, 250, 60), (520, 260, 56)]
    s.append('<g fill="#2F5D50">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in leaves) + '</g>')
    s.append('<g fill="#4F8A6E" opacity=".75">' + "".join(
        f'<circle cx="{x-14}" cy="{y-16}" r="{r*0.62:.0f}"/>' for x, y, r in leaves) + '</g>')
    # apples in the tree
    for (x, y, r) in [(90, 110, 15), (190, 80, 14), (300, 110, 16), (410, 90, 14), (505, 130, 15), (150, 200, 13),
                      (260, 200, 14), (380, 210, 15), (520, 230, 12), (60, 230, 12), (450, 40, 12)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#{p}apple)"/>'
                 f'<circle cx="{x-r*0.35:.1f}" cy="{y-r*0.35:.1f}" r="{r*0.25:.1f}" fill="#fff" opacity=".7"/>'
                 f'<path d="M{x},{y-r} q2,-7 6,-9" stroke="#4E3326" stroke-width="2.5" fill="none" stroke-linecap="round"/>')
    # branch
    s.append(f'<path d="M110,330 C220,300 360,300 560,318 L560,350 C380,334 230,340 130,368Z" fill="url(#{p}bark)"/>')
    s.append('<path d="M140,338 C240,316 360,316 540,326" fill="none" stroke="#9A7058" stroke-width="5" stroke-linecap="round" opacity=".6"/>')
    s.append('<g fill="#4F8A6E"><ellipse cx="545" cy="312" rx="22" ry="10" transform="rotate(-20 545 312)"/>'
             '<ellipse cx="470" cy="312" rx="18" ry="8" transform="rotate(-30 470 312)"/></g>')
    # --- serpent
    SN = "url(#rmi_snake)"
    # tail hanging from the coil down-left, curling round the offered apple
    tail = "M215,342 C175,390 160,470 205,520 C240,560 270,590 252,630 C240,655 205,660 192,640"
    s.append(f'<path d="{tail}" fill="none" stroke="{SN}" stroke-width="34" stroke-linecap="round"/>')
    s.append(f'<path d="{tail}" fill="none" stroke="#D9F0B0" stroke-width="10" stroke-linecap="round" opacity=".7" transform="translate(7,4)"/>')
    # back parts of the coils (behind branch)
    for x in (230, 300, 370):
        s.append(f'<path d="M{x-20},{312} L{x+20},{352}" stroke="#3C7A5A" stroke-width="32" stroke-linecap="round"/>')
    # redraw branch front so back parts sit behind it
    s.append(f'<path d="M190,316 C260,306 330,304 420,308 L420,342 C330,338 260,340 190,350Z" fill="url(#{p}bark)"/>')
    # front crossings
    for x in (230, 300, 370):
        s.append(f'<path d="M{x-24},{358} Q{x},{330} {x+22},{300}" fill="none" stroke="{SN}" stroke-width="36" stroke-linecap="round"/>'
                 f'<path d="M{x-16},{348} Q{x+4},{326} {x+20},{304}" fill="none" stroke="#D9F0B0" stroke-width="9" stroke-linecap="round" opacity=".6"/>')
    # neck: from the coil down to the big head
    neck = "M392,300 C470,300 480,380 440,420 C420,440 400,445 380,450"
    s.append(f'<path d="{neck}" fill="none" stroke="{SN}" stroke-width="44" stroke-linecap="round"/>')
    s.append(f'<path d="{neck}" fill="none" stroke="#D9F0B0" stroke-width="12" stroke-linecap="round" opacity=".6" transform="translate(-8,6)"/>')
    # spots on the body
    s.append('<g fill="#B48CE0" opacity=".7"><circle cx="458" cy="350" r="6"/><circle cx="452" cy="392" r="5"/>'
             '<circle cx="185" cy="430" r="5"/><circle cx="190" cy="480" r="6"/><circle cx="236" cy="560" r="5"/></g>')
    # head
    hx, hy = 330, 470
    s.append(f'<path d="M{hx-92},{hy+4} C{hx-96},{hy-60} {hx-40},{hy-82} {hx+6},{hy-80} C{hx+70},{hy-78} {hx+104},{hy-40} {hx+96},{hy+10} '
             f'C{hx+90},{hy+52} {hx+40},{hy+70} {hx},{hy+68} C{hx-50},{hy+68} {hx-88},{hy+44} {hx-92},{hy+4}Z" fill="url(#rmi_head)"/>')
    s.append(f'<path d="M{hx-60},{hy+30} C{hx-30},{hy+56} {hx+40},{hy+58} {hx+70},{hy+30} C{hx+50},{hy+64} {hx-40},{hy+66} {hx-60},{hy+30}Z" fill="#D9F0B0" opacity=".55"/>')
    s.append(f'<ellipse cx="{hx-30}" cy="{hy-58}" rx="34" ry="10" fill="#fff" opacity=".22"/>')
    # big sly half-lidded eyes
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 40, hy - 18
        s.append(f'<ellipse cx="{ex}" cy="{ey}" rx="30" ry="27" fill="#fff"/>'
                 f'<ellipse cx="{ex+10}" cy="{ey+6}" rx="13" ry="16" fill="#3A2550"/>'
                 f'<circle cx="{ex+6}" cy="{ey+1}" r="4.5" fill="#fff"/>'
                 f'<path d="M{ex-33},{ey+2} Q{ex},{ey-12} {ex+33},{ey+2} L{ex+33},{ey-32} L{ex-33},{ey-32}Z" fill="#5FAE6E"/>'
                 f'<path d="M{ex-33},{ey+2} Q{ex},{ey-12} {ex+33},{ey+2}" fill="none" stroke="#2A3A2E" stroke-width="5" stroke-linecap="round"/>'
                 f'<path d="M{ex+sgn*18},{ey+1} l{sgn*14},-6" stroke="#2A3A2E" stroke-width="3.5" stroke-linecap="round"/>')
    # nostrils, smirk, tongue
    s.append(f'<circle cx="{hx-10}" cy="{hy+22}" r="3" fill="#2A3A2E"/><circle cx="{hx+12}" cy="{hy+22}" r="3" fill="#2A3A2E"/>')
    s.append(f'<path d="M{hx-36},{hy+36} Q{hx},{hy+50} {hx+38},{hy+32} Q{hx+48},{hy+26} {hx+52},{hy+18}" fill="none" stroke="#2A3A2E" stroke-width="5" stroke-linecap="round"/>')
    s.append(f'<path d="M{hx+4},{hy+44} Q{hx+2},{hy+62} {hx-4},{hy+72} M{hx+2},{hy+60} Q{hx+8},{hy+70} {hx+12},{hy+74}" fill="none" stroke="#F58AB0" stroke-width="5" stroke-linecap="round"/>')
    s.append(f'<circle cx="{hx-66}" cy="{hy+14}" r="12" fill="#F28B82" opacity=".45"/><circle cx="{hx+68}" cy="{hy+12}" r="12" fill="#F28B82" opacity=".45"/>')
    # offered apple, held in the tail tip
    ax, ay = 170, 610
    s.append(glow(f"{p}ag", ax, ay - 6, 110))
    s.append(f'<path d="M{ax},{ay-46} C{ax-24},{ay-62} {ax-60},{ay-50} {ax-58},{ay-6} C{ax-56},{ay+36} {ax-24},{ay+56} {ax},{ay+44} '
             f'C{ax+24},{ay+56} {ax+56},{ay+36} {ax+58},{ay-6} C{ax+60},{ay-50} {ax+24},{ay-62} {ax},{ay-46}Z" fill="url(#{p}apple)"/>')
    s.append(f'<path d="M{ax},{ay-44} q4,-20 14,-26" stroke="#4E3326" stroke-width="6" fill="none" stroke-linecap="round"/>'
             f'<path d="M{ax+8},{ay-58} q24,-18 40,-4 q-20,14 -40,4z" fill="#7FB07A"/>'
             f'<ellipse cx="{ax-26}" cy="{ay-20}" rx="10" ry="16" transform="rotate(25 {ax-26} {ay-20})" fill="#fff" opacity=".75"/>'
             f'<circle cx="{ax-30}" cy="{ay+8}" r="5" fill="#fff" opacity=".5"/>')
    # tail tip curling over the apple's front
    s.append(f'<path d="M232,640 C214,662 180,664 150,650 C128,640 120,620 130,606" fill="none" stroke="{SN}" stroke-width="22" stroke-linecap="round"/>')
    s.append(sparkle_star(ax + 52, ay - 52, 18, "#FFF3D6", "tw"))
    s.append(sparkle_star(ax - 66, ay - 54, 10, "#FFF3D6", "tw2"))
    s.append(sparkle_star(ax + 74, ay + 4, 8, "#FFF3D6", "tw3"))
    s.append(sparkle_star(480, 450, 12, "#FFE3B0", "tw2"))
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
