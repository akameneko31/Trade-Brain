import { useState, useEffect, useCallback, useMemo } from "react";

// ════════════════════════════════════════
// QUESTION DATA (24 factor + 3 inago = 27)
// ════════════════════════════════════════
const ALL_QUESTIONS = [
  // Reward Drive (Q1-Q4, Q4 reverse)
  { id: 1, factor: "reward", text: "値動きが激しい銘柄を見ると自然と興味が湧く。", reverse: false },
  { id: 2, factor: "reward", text: "1日トレードしないと機会損失を感じる。", reverse: false },
  { id: 3, factor: "reward", text: "小さな値幅より、大きな値幅を狙いたくなる。", reverse: false },
  { id: 4, factor: "reward", text: "ボラティリティが低くても淡々とトレードできる。", reverse: true },

  // Loss Response (Q5-Q8, Q8 reverse)
  { id: 5, factor: "loss", text: "含み損が出ると、他のことをしていても気になる。", reverse: false },
  { id: 6, factor: "loss", text: "連敗が続くと、自信が揺らぐ。", reverse: false },
  { id: 7, factor: "loss", text: "損失が出ると、すぐ取り返したくなることがある。", reverse: false },
  { id: 8, factor: "loss", text: "利益でも損失でも、感情はあまり変わらない。", reverse: true },

  // Impulse Control (Q9-Q12, Q11/Q12 reverse)
  // NOTE: Q9は「後付け＝衝動性（悪い）」なので reverse:true
  { id: 9, factor: "impulse", text: "エントリー後に根拠を後付けしたことがある。", reverse: true },
  { id: 10, factor: "impulse", text: "事前に決めたルールを守ることができる。", reverse: false },
  { id: 11, factor: "impulse", text: "何となく気分でロットを増減することがある。", reverse: true },
  { id: 12, factor: "impulse", text: "急騰銘柄を発見したら、つい飛び乗ってしまうことがある。", reverse: true },

  // Processing Speed (Q13-Q16, Q16 reverse)
  { id: 13, factor: "speed", text: "チャートを一瞬見ただけで大まかな状況を把握できる。", reverse: false },
  { id: 14, factor: "speed", text: "複数の時間足を同時に見ても混乱しない。", reverse: false },
  { id: 15, factor: "speed", text: "相場が急変しても判断が遅れにくい。", reverse: false },
  { id: 16, factor: "speed", text: "情報量が多いと判断が止まる。", reverse: true },

  // Analytical Depth (Q17-Q20, Q20 reverse)
  { id: 17, factor: "analysis", text: "決算短信やIR資料を自分で読み込むことがある。", reverse: false },
  { id: 18, factor: "analysis", text: "数字の変化を見て、その背景を考えるのが好きだ。", reverse: false },
  { id: 19, factor: "analysis", text: "投資判断の前に、複数のシナリオを想定する。", reverse: false },
  { id: 20, factor: "analysis", text: "直感が良ければ細かい数字はあまり気にしない。", reverse: true },

  // Time Horizon (Q21-Q24, Q24 reverse)
  { id: 21, factor: "time", text: "数ヶ月単位でポジションを保有することに抵抗がない。", reverse: false },
  { id: 22, factor: "time", text: "投資成果は、短期よりも時間をかけて積み上げる方が合理的だと思う。", reverse: false },
  { id: 23, factor: "time", text: "多少の含み損は許容できるし、値動きはのんびり待つ方が好きだ。", reverse: false },
  { id: 24, factor: "time", text: "利益が出ると、早めに確定して安心したくなる。", reverse: true },

  // Inago Correction (Q25-Q27)
  { id: 25, factor: "inago", text: "SNSで話題の銘柄はとりあえずチェックする。", reverse: false },
  { id: 26, factor: "inago", text: "急騰ランキングに入った銘柄をその場で買ったことがある。", reverse: false },
  { id: 27, factor: "inago", text: "周囲が買っていると自分も乗り遅れたくないと感じる。", reverse: false },
];

const FACTOR_ORDER = ["reward", "loss", "impulse", "speed", "analysis", "time"];

const FACTOR_META = {
  reward: {
    name: "Reward Drive",
    label: "報酬駆動",
    color: "#FF6B35",
    icon: "🔥",
    highDesc: "刺激的な値動きへの感度が高く、リスクテイクへの積極性がある。高ボラ環境で活力を得るタイプ。",
    lowDesc: "穏やかな値動きでも冷静に取り組める。堅実志向で安定を重視する傾向。",
  },
  loss: {
    name: "Loss Response",
    label: "損失反応",
    color: "#E63946",
    icon: "💔",
    highDesc: "損失に対する情動反応が強い。含み損が判断へ影響しやすく、リベンジトレードのリスクが上がる。",
    lowDesc: "損失に対して比較的冷静。感情の揺れが少なく、淡々と判断を継続できるタイプ。",
  },
  impulse: {
    name: "Impulse Control",
    label: "衝動制御",
    color: "#2EC4B6",
    icon: "🛡️",
    highDesc: "ルール遵守力が高く、計画的なトレードを実行できる。感情に流されにくい自律型。",
    lowDesc: "衝動的な売買が発生しやすい。飛びつきエントリーやロスカット無視のリスクあり。",
  },
  speed: {
    name: "Processing Speed",
    label: "処理速度",
    color: "#4ECDC4",
    icon: "⚡",
    highDesc: "情報処理が速く、瞬時の判断に強い。短期トレードで優位性を発揮しやすい。",
    lowDesc: "情報過多で判断が鈍りやすい。じっくり分析する環境の方がパフォーマンスを出しやすい。",
  },
  analysis: {
    name: "Analytical Depth",
    label: "分析深度",
    color: "#7B68EE",
    icon: "🔬",
    highDesc: "深い分析を好み、ファンダメンタルズやシナリオ構築に強い。中長期投資との親和性が高い。",
    lowDesc: "直感重視で素早い判断を好む。分析よりもアクションを優先する傾向。",
  },
  time: {
    name: "Time Horizon",
    label: "時間耐性",
    color: "#FFD166",
    icon: "⏳",
    highDesc: "長期保有への耐性が高い。含み損にも動じず、時間を味方につける投資が得意。",
    lowDesc: "短期での結果を求める傾向。ポジション保有期間が長くなるとストレスを感じやすい。",
  },
};

const LIKERT = [
  { value: 1, label: "全く当てはまらない" },
  { value: 2, label: "あまり当てはまらない" },
  { value: 3, label: "どちらともいえない" },
  { value: 4, label: "やや当てはまる" },
  { value: 5, label: "非常に当てはまる" },
];

const STYLE_NAMES = {
  scalp: "スキャルピング",
  dayTrade: "デイトレード",
  swing: "スイングトレード",
  fundamental: "ファンダメンタル投資",
  index: "インデックス/積立",
};

// ════════════════════════════════════════
// CONTRAST STRETCH
// ════════════════════════════════════════
function contrastStretch(score) {
  return Math.round(Math.min(100, Math.max(0, 50 + (score - 50) * 1.35)));
}

// ════════════════════════════════════════
// TRADER TYPES + PIXEL ART
// ════════════════════════════════════════
function parsePx(rows, pal) {
  return rows.map((r) => [...r].map((c) => pal[c] ?? null));
}
const BP = { "0": null, "1": "#0f1419", "2": "#FBBF7C", "3": "#ffffff", "4": "#0f1419", "5": "#D4836B" };

const TRADER_TYPES = {
  sprinter: {
    name: "スプリンター",
    title: "疾風の",
    sub: "The Sprinter",
    icon: "🔥",
    color: "#FF6B35",
    attr: "瞬発攻撃型",
    desc: "ボラティリティを武器にチャンスを瞬時に察知する。短期戦で真価を発揮する速攻型トレーダー。",
    field: "デイトレ / 高ボラ銘柄",
    pixels: parsePx(
      [
        "000666666000",
        "006666666600",
        "099999999990",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#6b4400", "7": "#E8851E", "9": "#FFD166" }
    ),
  },
  sniper: {
    name: "スナイパー",
    title: "精密なる",
    sub: "The Sniper",
    icon: "🎯",
    color: "#4ECDC4",
    attr: "精密実行型",
    desc: "高速判断と規律を両立する精密射撃型。無駄撃ちが少なく、再現性の高いトレードを実行する。",
    field: "スキャル / ルール型短期",
    pixels: parsePx(
      [
        "000066660000",
        "006666666600",
        "066666666660",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#1a3a3a", "7": "#4ECDC4" }
    ),
  },
  strategist: {
    name: "ストラテジスト",
    title: "深謀の",
    sub: "The Strategist",
    icon: "🧠",
    color: "#7B68EE",
    attr: "戦略設計型",
    desc: "シナリオ構築と長期視点で勝率を高める戦略家。感情より構造を信じて着実に勝ちを積む。",
    field: "スイング / 中長期投資",
    pixels: parsePx(
      [
        "000666666000",
        "006666666600",
        "066666666660",
        "012222222210",
        "018342834810",
        "018422428810",
        "018888888810",
        "001225522100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#2a1a4a", "7": "#7B68EE", "8": "#9999bb" }
    ),
  },
  guardian: {
    name: "ガーディアン",
    title: "鉄壁の",
    sub: "The Guardian",
    icon: "🛡",
    color: "#2EC4B6",
    attr: "メンタル安定型",
    desc: "感情に振り回されず、損失管理に強い堅実派。ルールを守り抜く精神力で資産を守る。",
    field: "安定運用 / リスク管理型",
    pixels: parsePx(
      [
        "000888888000",
        "008666666800",
        "086666666680",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#1a3328", "7": "#2a6b5a", "8": "#2EC4B6" }
    ),
  },
  raider: {
    name: "レイダー",
    title: "理論武装の",
    sub: "The Raider",
    icon: "⚔",
    color: "#E07A5F",
    attr: "理論武装攻撃型",
    desc: "材料を武器に攻めるハイブリッド型。理屈と攻撃性を両立し、テーマ株やイベント相場で力を発揮する。",
    field: "材料株 / イベント相場",
    pixels: parsePx(
      [
        "060066006060",
        "066666666660",
        "066666666660",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001777777100",
        "017797777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#5a2010", "7": "#E07A5F", "9": "#FFD166" }
    ),
  },
  sage: {
    name: "セージ",
    title: "泰然たる",
    sub: "The Sage",
    icon: "⏳",
    color: "#6C63AC",
    attr: "静観長期型",
    desc: "待てる力と欲に振り回されない冷静さを持つ。積立適性が高く、時間を最大の武器にする。",
    field: "インデックス / 長期投資",
    pixels: parsePx(
      [
        "006666666600",
        "066666666660",
        "062222222260",
        "062222222260",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001666666100",
        "016666666610",
        "016066660610",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#2a2455" }
    ),
  },
  assassin: {
    name: "アサシン",
    title: "冷静なる",
    sub: "The Assassin",
    icon: "⚡",
    color: "#3D8B7A",
    attr: "冷静高速型",
    desc: "情動に左右されない冷酷な判断速度を持つ。ロスカットに躊躇がなく、超短期や急変相場に強い。",
    field: "超短期 / 急変相場",
    pixels: parsePx(
      [
        "000166661000",
        "001666666100",
        "016666666610",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001111111100",
        "011777777110",
        "011077770110",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#1a2a25", "7": "#1a1a1a" }
    ),
  },
  berserker: {
    name: "バーサーカー",
    title: "本能の",
    sub: "The Berserker",
    icon: "🌪",
    color: "#E63946",
    attr: "ハイリスク型",
    desc: "刺激依存傾向とリベンジ衝動を併せ持つ。爆発力はあるが、自制が課題。管理体制が生死を分ける。",
    field: "ハイボラ環境（※管理必須）",
    pixels: parsePx(
      [
        "060060060060",
        "066066066060",
        "066666666660",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001222252100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#8B0000", "7": "#E63946" }
    ),
  },
  allrounder: {
    name: "オールラウンダー",
    title: "万能の",
    sub: "The All-Rounder",
    icon: "🧩",
    color: "#8B9DAF",
    attr: "バランス型",
    desc: "極端な強み弱みがなく、環境に応じて柔軟に対応できる適応型。どの方向にも伸びしろがある。",
    field: "環境適応型 / 育成余地大",
    pixels: parsePx(
      [
        "000666666000",
        "006666666600",
        "066666666660",
        "012222222210",
        "012342234210",
        "012422224210",
        "012222222210",
        "001225522100",
        "000122221000",
        "001777777100",
        "017777777710",
        "017077770710",
        "001100001100",
        "001100001100",
      ],
      { ...BP, "6": "#3a3530", "7": "#607080" }
    ),
  },
};

function PixelChar({ pixels, scale = 6 }) {
  const rows = pixels.length;
  const cols = pixels[0].length;
  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${cols}, ${scale}px)`,
        gridTemplateRows: `repeat(${rows}, ${scale}px)`,
        imageRendering: "pixelated",
        filter: "drop-shadow(0 0 12px rgba(78,205,196,0.15))",
      }}
    >
      {pixels.flat().map((c, i) => (
        <div key={i} style={{ background: c || "transparent" }} />
      ))}
    </div>
  );
}

// allrounder を「平均との差が小さいほど高い」スコアへ
function allrounderScore(scores) {
  const keys = ["reward", "loss", "impulse", "speed", "analysis", "time"];
  const dist = keys.reduce((acc, k) => acc + Math.abs((scores[k] ?? 50) - 50), 0); // 0..300
  const v = 100 - (dist / 300) * 100; // 0..100
  return Math.max(0, Math.min(100, v));
}

function determineTypes(scores) {
  const { reward: R, loss: L, impulse: I, speed: P, analysis: A, time: T } = scores;

  const typeScores = {
    sprinter: R * 0.35 + P * 0.35 + (100 - T) * 0.15 + (100 - L) * 0.15,
    sniper: P * 0.35 + I * 0.30 + (100 - L) * 0.20 + (100 - R) * 0.15,
    strategist: A * 0.35 + T * 0.25 + I * 0.20 + (100 - R) * 0.10 + (100 - L) * 0.10,
    guardian: I * 0.35 + (100 - L) * 0.30 + T * 0.15 + A * 0.10 + (100 - R) * 0.10,
    raider: R * 0.30 + A * 0.30 + P * 0.15 + (100 - T) * 0.15 + (100 - L) * 0.10,
    sage: T * 0.35 + (100 - R) * 0.30 + A * 0.15 + I * 0.10 + (100 - L) * 0.10,
    assassin: P * 0.35 + (100 - L) * 0.30 + I * 0.15 + (100 - R) * 0.10 + (100 - T) * 0.10,
    berserker: R * 0.35 + L * 0.30 + (100 - I) * 0.20 + (100 - T) * 0.15,
    allrounder: allrounderScore(scores),
  };

  const sorted = Object.entries(typeScores).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0], secondary: sorted[1][0] };
}

// ════════════════════════════════════════
// SHUFFLE: no 3+ consecutive same factor
// ════════════════════════════════════════
function shuffleQuestions(questions) {
  if (!questions || questions.length === 0) return [];

  let bestResult = null;
  let bestViolations = Infinity;

  for (let attempt = 0; attempt < 10; attempt++) {
    const pool = [...questions];
    const result = [];
    let stuck = 0;

    while (pool.length > 0 && stuck < 200) {
      const idx = Math.floor(Math.random() * pool.length);
      const candidate = pool[idx];
      const len = result.length;

      if (len >= 2 && result[len - 1].factor === candidate.factor && result[len - 2].factor === candidate.factor) {
        stuck++;
        continue;
      }
      result.push(candidate);
      pool.splice(idx, 1);
      stuck = 0;
    }

    // Insert leftovers
    for (const leftover of pool) {
      let inserted = false;
      for (let i = result.length; i >= 0; i--) {
        const prev = i > 0 ? result[i - 1] : null;
        const prevPrev = i > 1 ? result[i - 2] : null;
        const next = i < result.length ? result[i] : null;

        const prevOk =
          !prev || !prevPrev || !(prev.factor === leftover.factor && prevPrev.factor === leftover.factor);
        const nextOk = !next || !prev || !(next.factor === leftover.factor && prev.factor === leftover.factor);

        if (prevOk && nextOk) {
          result.splice(i, 0, leftover);
          inserted = true;
          break;
        }
      }
      if (!inserted) result.push(leftover);
    }

    // Count violations
    let violations = 0;
    for (let i = 2; i < result.length; i++) {
      if (result[i].factor === result[i - 1].factor && result[i].factor === result[i - 2].factor) violations++;
    }

    if (violations < bestViolations) {
      bestViolations = violations;
      bestResult = result;
    }
    if (violations === 0) break;
  }

  return bestResult ?? [...questions];
}

// ════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════
function RadarChart({ scores, size = 300 }) {
  const center = size / 2;
  const radius = size * 0.36;
  const levels = 5;

  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = (val / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLines = Array.from({ length: levels }, (_, l) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const p = getPoint(i, ((l + 1) / levels) * 100);
      return `${p.x},${p.y}`;
    });
    return pts.join(" ");
  });

  const dataPoints = FACTOR_ORDER.map((k, i) => getPoint(i, scores[k] || 0));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const labels = FACTOR_ORDER.map((k, i) => ({ ...getPoint(i, 122), key: k }));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {FACTOR_ORDER.map((_, i) => {
        const p = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}
      <polygon points={dataPath} fill="rgba(78,205,196,0.18)" stroke="#4ECDC4" strokeWidth="2.5" />
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill={FACTOR_META[FACTOR_ORDER[i]].color}
          stroke="#0d1117"
          strokeWidth="2"
        />
      ))}
      {labels.map((l) => (
        <text
          key={l.key}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.8)"
          fontSize="10.5"
          fontWeight="600"
          fontFamily="'Noto Sans JP', sans-serif"
        >
          {FACTOR_META[l.key].icon} {FACTOR_META[l.key].label}
        </text>
      ))}
    </svg>
  );
}

function ProgressBar({ pct }) {
  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 5, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #4ECDC4, #2EC4B6)",
          borderRadius: 8,
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

function AnimBar({ score, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(score), 80 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 6, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  return (
    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

function StyleRow({ nameJp, nameEn, score, badge }) {
  const barColor = score >= 70 ? "#2EC4B6" : score >= 50 ? "#FFD166" : score >= 35 ? "#E07A5F" : "#E63946";
  const isBest = badge && !badge.includes("非推奨");

  return (
    <div
      style={{
        padding: "12px 16px",
        background: isBest ? "rgba(46,196,182,0.05)" : "rgba(255,255,255,0.02)",
        borderRadius: 10,
        border: isBest ? "1px solid rgba(46,196,182,0.25)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <span style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>{nameJp}</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginLeft: 8 }}>{nameEn}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {badge && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 6,
                background: isBest ? "rgba(46,196,182,0.15)" : "rgba(230,57,70,0.12)",
                color: isBest ? "#2EC4B6" : "#E63946",
              }}
            >
              {badge}
            </span>
          )}
          <span style={{ color: barColor, fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <AnimBar score={score} color={barColor} />
    </div>
  );
}

// ════════════════════════════════════════
// SCORING ENGINE
// ════════════════════════════════════════
function calcFactorScores(answers, questionSet) {
  const scores = {};

  FACTOR_ORDER.forEach((fk) => {
    const qs = questionSet.filter((q) => q.factor === fk);
    const numQ = qs.length;
    if (numQ === 0) {
      scores[fk] = 50;
      return;
    }

    let raw = 0;
    qs.forEach((q) => {
      const ans = answers[q.id] ?? 3;
      raw += q.reverse ? 6 - ans : ans;
    });

    scores[fk] = Math.round(((raw - numQ) / (numQ * 4)) * 100);
  });

  // Inago correction (always ON)
  const inagoQs = questionSet.filter((q) => q.factor === "inago");
  if (inagoQs.length > 0) {
    let inagoRaw = 0;
    inagoQs.forEach((q) => {
      inagoRaw += answers[q.id] ?? 3;
    });
    const inagoScore = ((inagoRaw - inagoQs.length) / (inagoQs.length * 4)) * 100;
    const correction = inagoScore * 0.05; // ±5点相当
    const clamped = Math.min(5, Math.max(-5, correction));

    scores.reward = Math.round(Math.min(100, Math.max(0, scores.reward + clamped)));
    scores.impulse = Math.round(Math.min(100, Math.max(0, scores.impulse - clamped)));
  }

  // Contrast stretch
  FACTOR_ORDER.forEach((k) => {
    scores[k] = contrastStretch(scores[k]);
  });

  // Clamp all
  FACTOR_ORDER.forEach((k) => {
    scores[k] = Math.min(100, Math.max(0, scores[k]));
  });

  return scores;
}

function calcStyleScores(scores) {
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const R = scores.reward / 100,
    L = scores.loss / 100,
    I = scores.impulse / 100,
    P = scores.speed / 100,
    A = scores.analysis / 100,
    T = scores.time / 100;

  return {
    scalp: Math.round(clamp01(0.35 * R + 0.35 * P + 0.2 * I + 0.1 * (1 - L)) * 100),
    dayTrade: Math.round(clamp01(0.3 * R + 0.3 * P + 0.2 * I + 0.2 * (1 - L)) * 100),
    swing: Math.round(clamp01(0.2 * R + 0.1 * P + 0.25 * A + 0.25 * T + 0.2 * (1 - L)) * 100),
    fundamental: Math.round(clamp01(0.1 * R + 0.1 * P + 0.35 * A + 0.35 * T + 0.1 * (1 - L)) * 100),
    index: Math.round(clamp01(-0.1 * R + 0.05 * P + 0.3 * I + 0.4 * T + 0.2 * (1 - L)) * 100),
  };
}

function generateAnalysis(scores, styleScores) {
  const sorted = FACTOR_ORDER.map((k) => ({ key: k, score: scores[k] })).sort((a, b) => b.score - a.score);
  const top1 = sorted[0],
    top2 = sorted[1],
    low1 = sorted[5];

  const strength = {
    reward: "値動きへの感度が高く、リスクを積極的に取りにいける",
    loss: "損失に対する感受性が鋭く、損失局面で判断がブレやすい（管理が鍵）",
    impulse: "自分のルールを守る自律性が高く、計画的にトレードできる",
    speed: "情報処理が速く、瞬時の状況判断に優れている",
    analysis: "深い分析を好み、論理的に投資判断を組み立てられる",
    time: "長期的な視点で相場と向き合える忍耐力がある",
  };

  const moderate = {
    reward: "値動きへの関心は平均的で、過度な興奮には流されにくい",
    loss: "損失への反応は標準的で、極端には動揺しにくい",
    impulse: "ルール遵守の意識はあるが、場面によってはブレることもある",
    speed: "情報処理は標準的で、落ち着いた環境で力を発揮しやすい",
    analysis: "分析と直感のバランスを取りながら判断できる",
    time: "中期的な保有には対応でき、極端な短期・長期には偏らない",
  };

  const weakness = {
    reward: "過度にリスクを取りにいく傾向",
    loss: "損失時のメンタルへの影響の大きさ",
    impulse: "衝動的な売買判断をしてしまう点",
    speed: "情報が多い場面での判断の遅れ",
    analysis: "分析の浅さからくる判断の甘さ",
    time: "短期志向によるポジション保有の短さ",
  };

  const t1Desc = top1.score >= 60 ? strength[top1.key] : moderate[top1.key];
  const t2Desc = top2.score >= 60 ? strength[top2.key] : moderate[top2.key];

  let text = `あなたは${t1Desc}タイプです。${t2Desc}面も持ち合わせています。`;
  if (low1.score < 40) {
    text += `一方で、${weakness[low1.key]}には注意が必要です。`;
  }

  const stSorted = Object.entries(styleScores).sort((a, b) => b[1] - a[1]);
  if (stSorted[0][1] >= 60) {
    text += `投資スタイルとしては${STYLE_NAMES[stSorted[0][0]]}との相性が良い傾向です。`;
  } else {
    text += "特定スタイルへの突出した適性は見られず、バランス型のプロファイルです。";
  }

  return text;
}

function getWarnings(styleScores, scores) {
  const w = [];
  if (styleScores.scalp < 40 && styleScores.dayTrade < 45)
    w.push("短期売買は現時点では非推奨です。衝動制御や処理速度の強化が先決。");
  if (styleScores.index > 70 && scores.reward < 40) w.push("インデックス/積立投資が最も合理的な選択肢です。");
  if (scores.reward > 75 && scores.impulse < 40) w.push("衝動制御が課題です。飛びつきエントリーに注意してください。");
  if (scores.loss > 75) w.push("損失反応が非常に高い傾向です。ポジションサイズの見直しを推奨します。");
  return w;
}

function shareToX(scores, styleScores) {
  const { primary, secondary } = determineTypes(scores);
  const type = TRADER_TYPES[primary];
  const subType = TRADER_TYPES[secondary];

  const stSorted = Object.entries(styleScores).sort((a, b) => b[1] - a[1]);
  const top1 = stSorted[0],
    top2 = stSorted[1];
  const top1Name = top1[1] >= 60 ? STYLE_NAMES[top1[0]] : null;
  const top2Name = top2[1] >= 60 ? STYLE_NAMES[top2[0]] : null;

  const styleLine = top1Name && top2Name ? `▶ 適性: ${top1Name} / ${top2Name}` : top1Name ? `▶ 適性: ${top1Name}` : `▶ 適性: バランス型`;

  const lines = [
    `【トレード脳力診断】`,
    ``,
    `${type.icon} ${type.title}${type.name}【${type.attr}】`,
    `副タイプ: ${subType.name}（${subType.attr}）`,
    ``,
    ...FACTOR_ORDER.map((k) => `${FACTOR_META[k].icon}${FACTOR_META[k].label}: ${scores[k]}`),
    ``,
    styleLine,
    ``,
    "#トレード脳力診断 #投資行動診断",
  ];

  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
}

// ════════════════════════════════════════
// MAIN APP (FULL ONLY)
// ════════════════════════════════════════
export default function TradeBrainDiagnostic() {
  const [phase, setPhase] = useState("intro"); // intro | prelude | quiz | result
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [animating, setAnimating] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const startQuiz = useCallback(() => {
    const qs = [...ALL_QUESTIONS];
    setQuestions(shuffleQuestions(qs));
    setAnswers({});
    setCurrentIdx(0);
    setEndTime(null);
    setFadeIn(true);
    setPhase("prelude");
  }, []);

  const handleAnswer = useCallback(
    (value) => {
      if (animating) return;
      setAnimating(true);

      const qId = questions[currentIdx]?.id;
      setAnswers((prev) => ({ ...prev, [qId]: value }));

      setFadeIn(false);
      setTimeout(() => {
        setCurrentIdx((prevIdx) => {
          if (prevIdx < questions.length - 1) return prevIdx + 1;
          setEndTime(Date.now());
          setPhase("result");
          return prevIdx;
        });
        setFadeIn(true);
        setAnimating(false);
      }, 280);
    },
    [animating, questions, currentIdx]
  );

  const goBack = useCallback(() => {
    if (currentIdx > 0 && !animating) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setFadeIn(true);
      }, 180);
    }
  }, [currentIdx, animating]);

  const elapsedStr = useMemo(() => {
    if (!startTime || !endTime) return "";
    const s = Math.floor((endTime - startTime) / 1000);
    return `${Math.floor(s / 60)}分${(s % 60).toString().padStart(2, "0")}秒`;
  }, [startTime, endTime]);

  // ──── INTRO ────
  if (phase === "intro") {
    return (
      <div style={S.container}>
        <div style={S.card}>
          <div style={S.glow} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 44, marginBottom: 12, textAlign: "center" }}>🧠</div>
            <h1 style={S.title}>トレード脳力診断</h1>
            <p style={S.subtitle}>Trade Brain Diagnostic</p>
            <p style={S.desc}>あなたの投資行動特性を多角的に分析し、適性のある投資スタイルを判定します。</p>

            <button
              style={{
                ...S.modeBtn,
                border: "1px solid rgba(46,196,182,0.35)",
                background: "rgba(46,196,182,0.06)",
              }}
              onClick={startQuiz}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#e6edf3", fontSize: 16, fontWeight: 700 }}>📊 診断をはじめる</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4 }}>
                    27問 ・ 約3〜5分 ・ レーダーチャート付き
                  </div>
                </div>
                <span style={{ color: "#4ECDC4", fontSize: 20 }}>→</span>
              </div>
            </button>

            <div
              style={{
                padding: "14px 16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.04)",
                marginTop: 18,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["認知・性格特性を6つの軸で数値化", "投資スタイル適性を自動判定", "行動リスクの傾向を可視化（イナゴ補正含む）"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#4ECDC4", fontSize: 13 }}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 16 }}>
              ※ 投資助言ではありません。自己分析の参考としてご活用ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ──── PRELUDE ────
  if (phase === "prelude") {
    return (
      <div style={S.container}>
        <div
          style={{
            ...S.card,
            maxWidth: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 340,
            textAlign: "center",
            padding: "48px 32px",
          }}
        >
          <style>{`
            @keyframes preludeFadeUp1 { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
            @keyframes preludeFadeUp2 { from { opacity:0; transform:translateY(18px); } to { opacity:0.9; transform:translateY(0); } }
            @keyframes preludeBtnFade { from { opacity:0; } to { opacity:1; } }
          `}</style>

          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              letterSpacing: 2,
              margin: "0 0 28px",
              fontWeight: 600,
              animation: "preludeFadeUp1 0.8s ease both",
            }}
          >
            正確な分析のために
          </p>

          <p
            style={{
              color: "#e6edf3",
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.9,
              margin: "0 0 34px",
              animation: "preludeFadeUp2 0.8s ease 0.6s both",
            }}
          >
            「なりたい自分」ではなく<br />
            今の自分をありのまま答えてください
          </p>

          <button
            style={{
              padding: "14px 48px",
              background: "linear-gradient(135deg, #2EC4B6, #4ECDC4)",
              border: "none",
              borderRadius: 12,
              color: "#0d1117",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Noto Sans JP', sans-serif",
              letterSpacing: 1,
              animation: "preludeBtnFade 0.6s ease 1.2s both",
            }}
            onClick={() => {
              setStartTime(Date.now());
              setPhase("quiz");
            }}
          >
            はじめる
          </button>
        </div>
      </div>
    );
  }

  // ──── QUIZ ────
  if (phase === "quiz") {
    const q = questions[currentIdx];
    const pct = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

    return (
      <div style={S.container}>
        <div style={S.card}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                本格測定
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {startTime && <Timer startTime={startTime} />}
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  {questions.length > 0 ? `${currentIdx + 1}/${questions.length}` : `0/0`}
                </span>
              </div>
            </div>
            <ProgressBar pct={pct} />
          </div>

          <div
            style={{
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.28s ease",
              minHeight: 64,
              marginBottom: 22,
            }}
          >
            <p style={{ color: "#e6edf3", fontSize: 16, lineHeight: 1.75, fontWeight: 500, margin: 0 }}>{q?.text}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: fadeIn ? 1 : 0, transition: "opacity 0.28s ease" }}>
            {LIKERT.map((opt) => {
              const sel = answers[q?.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    border: `1px solid ${sel ? "rgba(46,196,182,0.4)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    cursor: "pointer",
                    background: sel ? "rgba(46,196,182,0.1)" : "rgba(255,255,255,0.025)",
                    transition: "all 0.18s",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    WebkitTapHighlightColor: "transparent",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: sel ? "rgba(46,196,182,0.22)" : "rgba(255,255,255,0.05)",
                      color: sel ? "#2EC4B6" : "rgba(255,255,255,0.45)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {opt.value}
                  </span>
                  <span style={{ color: sel ? "#e6edf3" : "rgba(255,255,255,0.6)", fontSize: 14 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {currentIdx > 0 && (
            <button onClick={goBack} style={S.backBtn}>
              ← 前の質問に戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  // ──── RESULT ────
  const scores = calcFactorScores(answers, ALL_QUESTIONS);
  const styleScores = calcStyleScores(scores);
  const stSorted = Object.entries(styleScores).sort((a, b) => b[1] - a[1]);

  const warnings = getWarnings(styleScores, scores);
  const analysisText = generateAnalysis(scores, styleScores);

  const traderTypes = determineTypes(scores);
  const mainType = TRADER_TYPES[traderTypes.primary];
  const subType = TRADER_TYPES[traderTypes.secondary];

  const getStyleBadge = (key, score, rank) => {
    if (rank === 0 && score >= 60) return "🥇 最適";
    if (rank === 1 && score >= 60) return "🥈 適性高";
    if (score < 35) return "⚠️ 非推奨";
    return null;
  };

  return (
    <div style={S.container}>
      <div style={{ ...S.card, maxWidth: 480, padding: "32px 20px" }}>
        <style>{`
          @keyframes typeReveal { from { opacity:0; transform:scale(0.8) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes typeFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pixelPop { 0% { opacity:0; transform:scale(0.3); } 60% { transform:scale(1.08); } 100% { opacity:1; transform:scale(1); } }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 4px", letterSpacing: 1, animation: "typeFadeIn 0.6s ease both" }}>
            FULL ANALYSIS RESULT
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 20px", animation: "typeFadeIn 0.6s ease 0.2s both" }}>
            あなたは…
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, animation: "pixelPop 0.7s cubic-bezier(.2,.8,.3,1.2) 0.5s both" }}>
            <PixelChar pixels={mainType.pixels} scale={7} />
          </div>

          <p style={{ color: mainType.color, fontSize: 13, fontWeight: 600, margin: "0 0 4px", letterSpacing: 2, animation: "typeFadeIn 0.6s ease 0.9s both" }}>
            ─── {mainType.title} ───
          </p>
          <h1 style={{ color: "#e6edf3", fontSize: 28, fontWeight: 800, margin: "0 0 4px", fontFamily: "'Noto Sans JP', sans-serif", animation: "typeReveal 0.7s cubic-bezier(.2,.8,.3,1) 1.0s both" }}>
            {mainType.name}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 8px", letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", animation: "typeFadeIn 0.5s ease 1.1s both" }}>
            {mainType.sub}
          </p>

          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${mainType.color}18`, border: `1px solid ${mainType.color}30`, marginBottom: 14, animation: "typeFadeIn 0.5s ease 1.2s both" }}>
            <span style={{ color: mainType.color, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{mainType.attr}</span>
          </div>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 8px", maxWidth: 340, marginLeft: "auto", marginRight: "auto", animation: "typeFadeIn 0.6s ease 1.4s both" }}>
            {mainType.desc}
          </p>

          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 20px", animation: "typeFadeIn 0.5s ease 1.5s both" }}>
            向きやすい戦場: <span style={{ color: mainType.color, fontWeight: 600 }}>{mainType.field}</span>
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, animation: "typeFadeIn 0.6s ease 1.7s both" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>副タイプ:</span>
            <span style={{ color: subType.color, fontWeight: 700, fontSize: 14 }}>
              {subType.icon} {subType.name}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{subType.attr}</span>
          </div>

          {elapsedStr && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "12px 0 0" }}>回答時間: {elapsedStr}</p>}
        </div>

        <div style={{ padding: "16px 20px", background: "rgba(46,196,182,0.04)", border: "1px solid rgba(46,196,182,0.12)", borderRadius: 12, marginBottom: 24 }}>
          <h2 style={{ color: "#4ECDC4", fontSize: 13, fontWeight: 700, margin: "0 0 8px", letterSpacing: 1 }}>💡 あなたの投資行動分析</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{analysisText}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <RadarChart scores={scores} size={310} />
        </div>

        <div style={S.section}>
          <h2 style={S.secTitle}>6因子スコア</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FACTOR_ORDER.map((key, i) => {
              const meta = FACTOR_META[key];
              const score = scores[key];
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600 }}>
                      {meta.icon} {meta.label}
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: 6 }}>{meta.name}</span>
                    </span>
                    <span style={{ color: meta.color, fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
                  </div>
                  <AnimBar score={score} color={meta.color} delay={i * 100} />
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "6px 0 0", lineHeight: 1.6 }}>
                    {score >= 60 ? meta.highDesc : meta.lowDesc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={S.section}>
          <h2 style={S.secTitle}>投資スタイル適性</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stSorted.map(([key, score], rank) => (
              <StyleRow
                key={key}
                nameJp={STYLE_NAMES[key]}
                nameEn={key.charAt(0).toUpperCase() + key.slice(1)}
                score={score}
                badge={getStyleBadge(key, score, rank)}
              />
            ))}
          </div>
        </div>

        {warnings.length > 0 && (
          <div style={S.section}>
            <h2 style={{ ...S.secTitle, color: "#E63946" }}>⚠️ 行動リスク</h2>
            {warnings.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  background: "rgba(230,57,70,0.05)",
                  border: "1px solid rgba(230,57,70,0.15)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginBottom: 8,
                }}
              >
                {w}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={S.shareBtn} onClick={() => shareToX(scores, styleScores)}>
            𝕏 で結果をシェア
          </button>
          <button
            style={S.retryBtn}
            onClick={() => {
              setPhase("intro");
            }}
          >
            もう一度
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          本診断は投資助言ではありません。結果は自己分析の参考としてご利用ください。<br />
          損失反応(1-L)は「反応が低い＝情動安定」として適性計算に使用しています。<br />
          イナゴ補正(±5点上限)がReward/Impulseに適用されています。
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// STYLES
// ════════════════════════════════════════
const S = {
  container: {
    minHeight: "100vh",
    background: "#0d1117",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px 12px",
    fontFamily: "'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    maxWidth: 440,
    width: "100%",
    background: "linear-gradient(168deg, rgba(28,33,42,0.96), rgba(13,17,23,0.99))",
    border: "1px solid rgba(255,255,255,0.055)",
    borderRadius: 20,
    padding: "36px 24px 28px",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 220,
    height: 220,
    background: "radial-gradient(circle, rgba(46,196,182,0.07), transparent 70%)",
    pointerEvents: "none",
  },
  title: {
    color: "#e6edf3",
    fontSize: 26,
    fontWeight: 800,
    textAlign: "center",
    margin: 0,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 12,
    textAlign: "center",
    margin: "4px 0 18px",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  desc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 1.7,
    textAlign: "center",
    margin: "0 0 18px",
  },
  modeBtn: {
    width: "100%",
    padding: "16px 20px",
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "'Noto Sans JP', sans-serif",
    WebkitTapHighlightColor: "transparent",
    textAlign: "left",
    transition: "all 0.2s",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    cursor: "pointer",
    marginTop: 14,
    padding: "8px 0",
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  section: {
    marginBottom: 24,
    paddingTop: 18,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  secTitle: {
    color: "#e6edf3",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 14,
    marginTop: 0,
  },
  shareBtn: {
    flex: 1,
    padding: "14px",
    background: "#e6edf3",
    border: "none",
    borderRadius: 12,
    color: "#0d1117",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  retryBtn: {
    flex: 1,
    padding: "14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Noto Sans JP', sans-serif",
  },
};
