import { useEffect, useMemo, useState } from "react";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function useElapsedTimer(
  startedAt: Date | string | undefined,
  running = true
): string {
  const startMs = useMemo(() => {
    if (!startedAt) return 0;
    return new Date(startedAt).getTime();
  }, [startedAt]);

  const [elapsed, setElapsed] = useState(() =>
    startMs ? Math.max(0, Math.floor((Date.now() - startMs) / 1000)) : 0
  );

  useEffect(() => {
    if (!startMs || !running) return;
    const update = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startMs, running]);

  return formatElapsed(elapsed);
}
