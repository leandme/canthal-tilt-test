"use client";

import { useEffect, useState } from "react";
import styles from "./EyeAnalysisLoadingStatus.module.css";

const STAGE_MS = 3200;

export type EyeAnalysisLoadingMessage = {
  title: string;
  body: string;
};

const DEFAULT_MESSAGES: EyeAnalysisLoadingMessage[] = [
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

type Props = {
  imageUrl?: string | null;
  title?: string;
  messages?: EyeAnalysisLoadingMessage[];
};

export default function EyeAnalysisLoadingStatus({
  imageUrl,
  title = "Building Your Eye Analysis",
  messages,
}: Props) {
  const statusMessages = messages?.length ? messages : DEFAULT_MESSAGES;
  const [elapsedMs, setElapsedMs] = useState(0);
  const lastIndex = statusMessages.length - 1;
  const activeIndex = Math.min(lastIndex, Math.floor(elapsedMs / STAGE_MS));
  const activeMessage = statusMessages[activeIndex];
  const progressPct = Math.min(97, (elapsedMs / (statusMessages.length * STAGE_MS)) * 100);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="order-1">
          <div className={styles.scanFrame} aria-hidden="true">
            {imageUrl ? (
              <img src={imageUrl} alt="" className={styles.scanImage} />
            ) : (
              <div className={styles.scanSilhouette} />
            )}
            <div className={styles.scanOverlay} />
            <div className={styles.scanGrid} />
            <div className={styles.scanLine} />
          </div>
        </div>

        <div className="order-2">
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-base text-gray-600 leading-relaxed">{activeMessage.body}</p>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-200/90" aria-hidden>
            <div
              className={`${styles.progressFill} h-full rounded-full bg-primary`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ol className="mt-6 space-y-3">
            {statusMessages.map((stage, idx) => {
              const isComplete = idx < activeIndex;
              const isActive = idx === activeIndex;

              return (
                <li
                  key={stage.title}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition ${
                    isActive ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isComplete
                        ? "bg-green-600 text-white"
                        : isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isComplete ? "✓" : idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                    {isActive ? <p className="mt-0.5 text-sm text-gray-600">{stage.body}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
