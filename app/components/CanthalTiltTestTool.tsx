"use client";

import { ReactNode, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/app/libs/amplitude";
import {
  CanthalTiltKey,
  EyeShapeKey,
  useEyeShapeAnalysis,
} from "@/app/hooks/useEyeShapeAnalysis";
import EyeAnalysisLoadingStatus, { type EyeAnalysisLoadingMessage } from "./EyeAnalysisLoadingStatus";

type FaqItem = {
  question: string;
  answer: ReactNode;
};

type EyeShapeRow = {
  key: Exclude<EyeShapeKey, "uncertain">;
  label: string;
  colorClass: string;
  textClass: string;
  pattern: string;
  direction: string;
};

type EyeShapeVisual = {
  id: string;
  title: string;
  src: string;
  description: string;
  shapeKey?: EyeShapeRow["key"];
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const FACE_EXAMPLES = [
  { id: "eye-a", label: "Example A", src: "/tools/eye-shape-detector/eye-example.jpg" },
  { id: "eye-b", label: "Example B", src: "/tools/eye-shape-detector/eye-example-2.jpg" },
  { id: "eye-c", label: "Example C", src: "/tools/eye-shape-detector/eyes-example-3.jpg" },
  { id: "eye-d", label: "Example D", src: "/tools/eye-shape-detector/eye-example-4.jpg" },
];

const EYE_SHAPE_ROWS: EyeShapeRow[] = [
  {
    key: "almond",
    label: "Almond",
    colorClass: "bg-green-50",
    textClass: "text-green-800",
    pattern: "Tapered outer corners with balanced vertical lid opening.",
    direction: "Most eyeliner and lash directions work with minimal correction.",
  },
  {
    key: "round",
    label: "Round",
    colorClass: "bg-blue-50",
    textClass: "text-blue-800",
    pattern: "Larger visible iris opening and more circular eye contour.",
    direction: "Outer-corner extension can add horizontal balance.",
  },
  {
    key: "hooded",
    label: "Hooded",
    colorClass: "bg-yellow-50",
    textClass: "text-yellow-800",
    pattern: "Upper lid fold sits lower over mobile lid area.",
    direction: "Lift-focused crease placement and outer lift lines often work best.",
  },
  {
    key: "monolid",
    label: "Monolid",
    colorClass: "bg-orange-50",
    textClass: "text-orange-800",
    pattern: "Minimal visible supratarsal crease with smooth lid plane.",
    direction: "Gradient shadow and tightlining can define without crowding lid space.",
  },
  {
    key: "upturned",
    label: "Upturned",
    colorClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    pattern: "Outer corners sit slightly higher than inner corners.",
    direction: "Balanced liner width helps keep lift without over-accentuating tilt.",
  },
  {
    key: "downturned",
    label: "Downturned",
    colorClass: "bg-red-50",
    textClass: "text-red-800",
    pattern: "Outer corners sit lower than inner corners at rest.",
    direction: "Lifted outer placement can visually neutralize downward tilt.",
  },
  {
    key: "deep-set",
    label: "Deep Set",
    colorClass: "bg-violet-50",
    textClass: "text-violet-800",
    pattern: "Eyes sit visually deeper under brow bone projection.",
    direction: "Reflective center-lid placement can bring forward eye presence.",
  },
  {
    key: "protruding",
    label: "Protruding",
    colorClass: "bg-cyan-50",
    textClass: "text-cyan-800",
    pattern: "Eye globe appears more prominent relative to orbital contour.",
    direction: "Softer matte contouring can add depth balance around lid perimeter.",
  },
];

const EYE_SHAPE_VISUALS: EyeShapeVisual[] = [
  {
    id: "almond",
    title: "Almond Eyes",
    src: "/tools/eye-shape-detector/almond-eyes.png",
    description:
      "Almond eyes have a slightly pointed outer corner and a visible crease. They are wider than they are tall, creating a naturally balanced look. This versatile shape works well with soft blends, bold liner, and subtle outer-corner lift.",
    shapeKey: "almond",
  },
  {
    id: "round",
    title: "Round Eyes",
    src: "/tools/eye-shape-detector/round-eyes.png",
    description:
      "Round eyes look open and circular, often with more visible white around the iris. They create a bright, youthful expression. Winged liner or smoky outer shading can add definition and gentle elongation.",
    shapeKey: "round",
  },
  {
    id: "hooded",
    title: "Hooded Eyes",
    src: "/tools/eye-shape-detector/hooded-eyes.png",
    description:
      "Hooded eyes have a lower-set upper fold that can partially cover the mobile lid and soften crease visibility. Lifted outer placement and controlled liner thickness usually work best. Blended, upward shadow placement helps keep the look open.",
    shapeKey: "hooded",
  },
  {
    id: "upturned",
    title: "Upturned Eyes",
    src: "/tools/eye-shape-detector/upturned%20eyes.png",
    description:
      "Upturned eyes have outer corners that sit higher than inner corners, giving a naturally lifted effect. This shape already carries cat-eye energy. Soft smoky blending or balanced liner width helps enhance lift without over-accentuating tilt.",
    shapeKey: "upturned",
  },
  {
    id: "downturned",
    title: "Downturned Eyes",
    src: "/tools/eye-shape-detector/downturned-eyes.png",
    description:
      "Downturned eyes have outer corners that sit lower than inner corners, creating a softer, gentler expression. Lifted outer-corner liner and upward shading can visually rebalance the tilt. Curled lashes and mascara also help open the eye area.",
    shapeKey: "downturned",
  },
  {
    id: "deep-set",
    title: "Deep-Set Eyes",
    src: "/tools/eye-shape-detector/deep-set-eyes.png",
    description:
      "Deep-set eyes sit farther under the brow bone, often creating natural crease depth and shadow. Light-reflective center-lid shades and soft blending can bring the eyes forward. Avoiding very heavy crease darkness helps maintain brightness.",
    shapeKey: "deep-set",
  },
  {
    id: "protruding",
    title: "Protruding Eyes",
    src: "/tools/eye-shape-detector/protruding-eyes.png",
    description:
      "Protruding eyes appear more forward relative to the orbital contour and often look expressive. Soft matte contouring and deeper outer-corner tones can add balance. Smudged liner and blended shadows help keep definition smooth, not harsh.",
    shapeKey: "protruding",
  },
  {
    id: "close-set",
    title: "Close-Set Eyes",
    src: "/tools/eye-shape-detector/close-set-eyes.png",
    description:
      "Close-set eyes have less space between inner corners. Brightening the inner corners and extending shadow outward can create the illusion of more distance. Winged or elongated liner styles usually enhance horizontal balance.",
  },
  {
    id: "wide-set",
    title: "Wide-Set Eyes",
    src: "/tools/eye-shape-detector/wide-set-eyes.png",
    description:
      "Wide-set eyes have more space between inner corners and can look fresh and open. Deeper inner-corner shading and defined liner can visually bring the eyes closer together. This shape also supports bold shadow looks while maintaining symmetry.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is canthal tilt?",
    answer:
      "Canthal tilt is the angle between the inner and outer eye corners. Positive tilt means the outer corner sits higher, neutral is close to level, and negative tilt means the outer corner sits lower.",
  },
  {
    question: "How accurate is this canthal tilt test?",
    answer:
      "This is a visual estimate, not a clinical measurement. Accuracy depends on photo quality, lighting, head position, and whether both eyes are clearly visible.",
  },
  {
    question: "What photo works best?",
    answer: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Front-facing portrait with both eyes clearly visible</li>
        <li>Even lighting with minimal shadows and reflections</li>
        <li>Neutral expression and natural eye opening</li>
        <li>No heavy filters and minimal head tilt</li>
      </ul>
    ),
  },
  {
    question: "Does this tool also detect eye shape?",
    answer:
      "Yes. The detector returns an estimated primary eye-shape category along with canthal tilt and dominant eye color.",
  },
  {
    question: "What do positive, neutral, and negative canthal tilt mean?",
    answer:
      "Positive means the outer eye corner appears higher than the inner corner, neutral means they are close to level, and negative means the outer corner appears lower.",
  },
  {
    question: "What does the confidence level mean?",
    answer:
      "Confidence reflects how clearly the model can detect stable eye-region cues in your photo. Better lighting, straight head position, and visible eyes usually increase confidence.",
  },
  {
    question: "Why did I get an uncertain result?",
    answer:
      "Uncertain results usually happen when the eyes are partially blocked, blurred, closed, heavily filtered, or captured at a strong angle.",
  },
  {
    question: "Why can results change between two photos of me?",
    answer:
      "Small differences in lighting, camera distance, head tilt, expression, and reflections can shift visual cues and produce different estimates.",
  },
  {
    question: "Can I wear glasses or contact lenses?",
    answer:
      "Contact lenses are usually fine, but reflective glasses can hide key landmarks. For best results, use a photo without glare across the eye area.",
  },
  {
    question: "Does makeup affect the scan?",
    answer:
      "Yes. Heavy eyeliner, lashes, and contouring can change visible lid and corner cues. If you want the most neutral estimate, use lighter makeup.",
  },
  {
    question: "Can I use a side-profile or angled selfie?",
    answer:
      "A front-facing portrait works best. Side profiles and strong angles can distort corner alignment and reduce canthal tilt reliability.",
  },
  {
    question: "Can this analyze multiple people in one photo?",
    answer:
      "No. Upload a photo with one clearly visible face to avoid ambiguity and improve detection quality.",
  },
  {
    question: "Is this tool for adults only?",
    answer:
      "This tool is intended for general appearance analysis and not for pediatric, clinical, or diagnostic interpretation.",
  },
  {
    question: "How do I compare results over time?",
    answer:
      "Use similar setup each time: same camera distance, lighting, head position, and expression. Consistent inputs create more comparable outputs.",
  },
  {
    question: "What file quality should I upload?",
    answer:
      "Use a clear, high-resolution image where both eyes are sharp and unobstructed. Very low-resolution or heavily compressed images reduce reliability.",
  },
  {
    question: "Can I use this for medical diagnosis?",
    answer:
      "No. This is an appearance-based AI estimate only. It should not be used for medical or diagnostic decisions.",
  },
  {
    question: "How This Canthal Tilt Test Works",
    answer: (
      <>
        <p>
          This tool estimates periorbital geometry from one portrait image: lid contour pattern,
          apparent canthal tilt direction and angle, and dominant iris color category.
        </p>
        <p className="mt-3">
          Results can change with lighting, pupil size, makeup, lens reflections, and camera
          angle. Keep photo setup consistent if you compare multiple scans.
        </p>
      </>
    ),
  },
  {
    question: "How To Improve Scan Quality",
    answer: (
      <ul className="list-disc pl-6 space-y-1">
        <li>Use a front-facing portrait with both eyes clearly visible.</li>
        <li>Avoid tinted lenses, strong reflections, or heavy shadows on the eyes.</li>
        <li>Use a neutral expression with natural eye opening.</li>
        <li>Prefer daylight or balanced white light for eye-color detection.</li>
      </ul>
    ),
  },
];

const EYE_LOADING_MESSAGES: EyeAnalysisLoadingMessage[] = [
  {
    title: "Photo intake and normalization",
    body: "Preparing your image and standardizing angle, framing, and facial scale.",
  },
  {
    title: "Eye landmark mapping",
    body: "Detecting inner and outer eye-corner landmarks and key lid reference points.",
  },
  {
    title: "Eyelid contour analysis",
    body: "Tracing upper and lower lid contours to classify your primary eye-shape pattern.",
  },
  {
    title: "Tilt and iris estimation",
    body: "Estimating canthal tilt direction and dominant iris-color signal from visible pixels.",
  },
  {
    title: "Final eye profile assembly",
    body: "Combining shape, tilt, and confidence signals before returning your result.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function confidenceBadgeClass(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "bg-green-100 text-green-800 border-green-200";
  if (confidence === "low") return "bg-red-100 text-red-800 border-red-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
}

function tiltColor(tilt: CanthalTiltKey) {
  if (tilt === "positive") return "text-green-700";
  if (tilt === "negative") return "text-red-700";
  if (tilt === "neutral") return "text-blue-700";
  return "text-gray-700";
}

function UploadBox() {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const goToImage = (url: string, source: "upload" | "example") => {
    router.push(`/?imageUrl=${encodeURIComponent(url)}&source=${source}`);
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("File size exceeds 5MB. Please upload a smaller image.");
      return;
    }

    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    goToImage(objectUrl, "upload");
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-lg p-6 border-2 border-dashed rounded-lg cursor-pointer border-gray-400 shadow-sm hover:shadow-md transition"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFile(dropped);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) handleFile(selected);
        }}
      />

      <button
        type="button"
        className="btn btn-lg btn-primary mt-10 mb-5 text-white transform transition-transform duration-200 hover:scale-105"
      >
        Upload Face Photo
      </button>

      <div className="text-center text-gray-600">
        <p className="text-base mb-2">drop a photo here,</p>
        <button
          type="button"
          className="text-xs mb-5 text-gray-600 hover:text-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = window.prompt("Paste an image URL (must start with http:// or https://)");
            if (!url) return;
            const cleaned = url.trim();
            if (!/^https?:\/\//i.test(cleaned)) {
              alert("Please paste a valid URL starting with http:// or https://");
              return;
            }
            goToImage(cleaned, "upload");
          }}
        >
          or paste <span className="underline underline-offset-2">URL</span>
        </button>
      </div>

      {fileName ? <p className="mt-4 text-sm text-primary font-semibold">Uploaded File: {fileName}</p> : null}
    </div>
  );
}

function TryExamples() {
  const router = useRouter();

  return (
    <div className="w-full mt-10 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="leading-tight font-bold text-base-content/70">
          <span className="inline sm:block">No photo?</span>{" "}
          <span className="inline sm:block">Try one of these:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {FACE_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                trackEvent("Try Canthal Tilt Test Example", { example: example.label });
                router.push(`/?imageUrl=${encodeURIComponent(example.src)}&source=example`);
              }}
              className="group relative rounded-2xl p-[2px] bg-transparent"
              aria-label={`Try ${example.label}`}
            >
              <div className="rounded-2xl bg-base-100 shadow-sm group-hover:shadow-md transition overflow-hidden">
                <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden">
                  <img
                    src={example.src}
                    alt={example.label}
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-base-content/60 leading-relaxed">
        By uploading a photo, you agree to our <a className="link" href="/terms">Terms of Service</a>. To learn more about how Canthal Tilt Test handles your personal data, check our <a className="link" href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  );
}

function CanthalTiltBar({ angle }: { angle: number }) {
  const bounded = clamp(angle, -15, 15);
  const markerPct = ((bounded + 15) / 30) * 100;

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="w-full px-6 pt-6 pb-5">
        <div className="relative">
          <div className="relative h-12 rounded-full overflow-hidden border border-black/10 bg-base-200 shadow-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(0,0,0,0.16)]">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to right, #ef4444 0%, #fde047 50%, #22c55e 100%)",
              }}
            />
            <div className="absolute inset-0 bg-white/15" />
          </div>

          <div
            className="absolute -top-3"
            style={{ left: `${markerPct}%`, transform: "translateX(-50%)" }}
            aria-label="Canthal tilt marker"
            title={`Canthal tilt ${bounded.toFixed(1)} degrees`}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "14px solid #111827",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))",
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between text-[11px] text-gray-600">
          {[-15, -10, -5, 0, 5, 10, 15].map((value) => (
            <span key={value} className="tabular-nums">
              {value}
            </span>
          ))}
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      </div>
    </div>
  );
}

function EyeShapeTable({ activeShape }: { activeShape: EyeShapeKey | null }) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-base-100">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
              Eye Shape
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
              Visual Pattern
            </th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-700 hidden sm:table-cell">
              Styling Direction
            </th>
          </tr>
        </thead>
        <tbody>
          {EYE_SHAPE_ROWS.map((row) => {
            const isActive = activeShape === row.key;
            const cellBase = "px-4 py-4 align-top";
            const activeCell = isActive ? "border-y-4 border-gray-900" : "border-y border-transparent";

            return (
              <tr key={row.key} className={row.colorClass}>
                <td
                  className={[
                    cellBase,
                    activeCell,
                    isActive ? "border-l-4 border-gray-900 rounded-l-xl" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold ${row.textClass}`}>{row.label}</span>
                    {isActive ? (
                      <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-2 py-0.5 text-xs font-semibold text-gray-900">
                        Your Result
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={[cellBase, activeCell].join(" ")}>
                  <p className="text-gray-700">{row.pattern}</p>
                  <p className="mt-1 text-sm text-gray-700 sm:hidden">{row.direction}</p>
                </td>
                <td
                  className={[
                    cellBase,
                    activeCell,
                    "hidden sm:table-cell text-gray-700",
                    isActive ? "border-r-4 border-gray-900 rounded-r-xl" : "",
                  ].join(" ")}
                >
                  {row.direction}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CanthalTiltTestTool() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("imageUrl");
  const source = searchParams.get("source") === "example" ? "example" : "upload";
  const { analysis, loading, error } = useEyeShapeAnalysis(imageUrl, { source });

  const activeShape = analysis?.shape ?? null;

  const sectionWrap = "w-full max-w-3xl mx-auto space-y-6 text-gray-900 pt-10 pb-10 lg:pt-20 lg:pb-20 leading-relaxed";
  const h2Class = "text-3xl lg:text-4xl font-semibold text-center";

  return (
    <main className="bg-base-100">
      <section className="flex flex-col items-center justify-start pt-10 px-6">
        <h1 className="text-4xl lg:text-5xl font-bold text-center">Canthal Tilt Test</h1>
        <p className="mt-4 text-center text-lg text-gray-700 max-w-2xl mx-auto">
          Upload a clear portrait to run an AI canthal tilt test and detect eye shape and eye color.
        </p>

        {!imageUrl ? (
          <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
            <div className="w-full max-w-md">
              <UploadBox />
            </div>
            <div className="w-full max-w-lg mt-6 lg:max-w-xl">
              <TryExamples />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl mt-10">
            {loading ? (
              <div className="w-full max-w-none px-0 sm:px-4 lg:px-8">
                <EyeAnalysisLoadingStatus
                  imageUrl={imageUrl}
                  title="Building Your Eye Analysis"
                  messages={EYE_LOADING_MESSAGES}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 lg:gap-16 items-start">
                <div className="w-full sm:max-w-sm lg:max-w-none justify-self-center">
                  <img
                    src={imageUrl}
                    alt="Uploaded image for canthal tilt test"
                    className="w-full max-w-[95vw] sm:max-w-sm lg:w-[360px] mx-auto rounded-2xl shadow-xl object-cover aspect-[3/4] bg-base-200"
                  />
                </div>

                <div className="w-full rounded-2xl border bg-white p-6 lg:p-8 shadow-sm">
                  <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">Eye Analysis Result</h2>

                  {error ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="whitespace-pre-line text-red-700">{error}</p>
                    </div>
                  ) : null}

                  {!error && analysis ? (
                    <div className="mt-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-4xl lg:text-5xl font-bold text-primary">{analysis.shapeLabel}</p>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${confidenceBadgeClass(
                            analysis.confidence
                          )}`}
                        >
                          {analysis.confidence.toUpperCase()} confidence
                        </span>
                      </div>

                      <p className="mt-3 text-lg text-gray-700">
                        Eye color: <span className="font-semibold">{analysis.eyeColorLabel}</span> (
                        <span className="font-semibold">{analysis.eyeColorConfidence}/100</span>)
                      </p>

                      <p className="mt-2 text-lg text-gray-700">
                        Canthal tilt: <span className={`font-semibold ${tiltColor(analysis.canthalTilt)}`}>{analysis.canthalTiltLabel}</span>
                        {analysis.canthalTiltAngle != null ? (
                          <>
                            {" "}(
                            <span className="font-semibold">{analysis.canthalTiltAngle.toFixed(1)}°</span>)
                          </>
                        ) : null}
                      </p>

                      {analysis.rationale ? <p className="mt-5 text-gray-700 leading-relaxed">{analysis.rationale}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="px-6">
        {analysis?.canthalTiltAngle != null ? (
          <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
            <h2 className={h2Class}>Canthal Tilt Interpretation</h2>
            <p className="mt-4 text-center text-lg text-gray-700">
              Marker shows estimated canthal tilt angle from negative to positive range.
            </p>
            <div className="mt-8">
              <CanthalTiltBar angle={analysis.canthalTiltAngle} />
            </div>
          </div>
        ) : null}

        <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
          <h2 className={h2Class}>Where Your Eye Shape Fits</h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            The highlighted row shows the detected primary eye-shape category.
          </p>
          <EyeShapeTable activeShape={activeShape} />
        </div>

        <div className="w-full max-w-3xl mx-auto pt-10 pb-10 lg:pt-20 lg:pb-20">
          <h2 className={h2Class}>Common Eye Shapes</h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            Quick visual examples of common eye-shape patterns.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {EYE_SHAPE_VISUALS.map((visual) => {
              const isActive = visual.shapeKey != null && activeShape === visual.shapeKey;
              return (
                <article
                  key={visual.id}
                  className={[
                    "overflow-hidden rounded-2xl border bg-white shadow-sm",
                    isActive ? "ring-2 ring-gray-900 border-gray-900/40" : "border-gray-200",
                  ].join(" ")}
                >
                  <div className="aspect-[3/2] bg-base-200">
                    <img
                      src={visual.src}
                      alt={`${visual.title} example`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl lg:text-2xl font-semibold text-gray-900">{visual.title}</h4>
                      {isActive ? (
                        <span className="inline-flex rounded-full border border-gray-900/20 bg-gray-900/10 px-3 py-1 text-sm font-semibold text-gray-900">
                          Your Result
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-lg text-gray-700 leading-relaxed">{visual.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {analysis?.observationNotes?.length ? (
          <div className={sectionWrap}>
            <h2 className={h2Class}>Key Observation Notes</h2>
            <ul className="list-disc pl-6 space-y-2 text-lg">
              {analysis.observationNotes.map((note, idx) => (
                <li key={`${note}-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={sectionWrap}>
          <h2 className={h2Class}>How to improve your Canthal Tilt</h2>
          <ul className="list-disc pl-6 space-y-2 text-lg">
            <li>Keep body fat in a healthier range to reduce facial puffiness around the eye area.</li>
            <li>
              If fat loss is your goal, track intake consistently with an{" "}
              <a className="link" href="https://skoy.ai" target="_blank" rel="noopener noreferrer">
                AI calorie tracker
              </a>
              .
            </li>
            <li>Improve sleep quality and hydration to reduce under-eye swelling and fluid retention.</li>
            <li>Limit high-sodium meals before photos, since temporary water retention can affect eye appearance.</li>
            <li>Use consistent photo angles and lighting to measure progress more accurately over time.</li>
          </ul>
        </div>

        <div className="hero pt-10 pb-10 lg:pt-20 lg:pb-20 flex items-center justify-center bg-base-100">
          <div className="hero-content w-full px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-center">Canthal Tilt Test FAQs</h2>
              <p className="py-6 text-lg mb-6 text-center">
                Common questions about canthal tilt analysis, eye-shape detection, and result interpretation.
              </p>
              <div className="space-y-4">
                {FAQ_ITEMS.map((item, idx) => (
                  <div key={`${item.question}-${idx}`} className="collapse collapse-plus border bg-base-500 rounded-lg">
                    <input type="radio" name="canthal-tilt-faq-accordion" />
                    <div className="collapse-title text-lg lg:text-xl">{item.question}</div>
                    <div className="collapse-content">
                      <div className="text-lg text-gray-700 leading-relaxed">{item.answer}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
