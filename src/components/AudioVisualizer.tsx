import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  isStreaming: boolean;
  getFrequencyData?: (array: Uint8Array) => void;
  accentColor?: 'cyan' | 'emerald' | 'purple';
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  isStreaming,
  getFrequencyData,
  accentColor = 'cyan',
  height = 64,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (getFrequencyData && (isPlaying || isStreaming)) {
        getFrequencyData(dataArray);
      } else if (isPlaying || isStreaming) {
        // Simulated rhythmic frequency when live analyser is idle
        phase += 0.08;
        for (let i = 0; i < dataArray.length; i++) {
          const val = Math.sin(phase + i * 0.3) * 60 + Math.cos(phase * 1.5 + i * 0.2) * 50 + 100;
          dataArray[i] = Math.max(20, Math.min(240, val));
        }
      } else {
        // Idle ambient subtle wave
        phase += 0.02;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(phase + i * 0.2) * 8 + 12;
        }
      }

      const barCount = 28;
      const totalWidth = canvas.width;
      const barSpacing = 4;
      const barWidth = (totalWidth - (barCount - 1) * barSpacing) / barCount;

      for (let i = 0; i < barCount; i++) {
        const rawValue = dataArray[i % dataArray.length];
        const normalized = (rawValue / 255);
        const barHeight = Math.max(4, normalized * (canvas.height - 8));
        const x = i * (barWidth + barSpacing);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        if (accentColor === 'cyan') {
          gradient.addColorStop(0, '#22d3ee');
          gradient.addColorStop(0.6, '#06b6d4');
          gradient.addColorStop(1, '#0284c7');
        } else if (accentColor === 'emerald') {
          gradient.addColorStop(0, '#34d399');
          gradient.addColorStop(0.6, '#10b981');
          gradient.addColorStop(1, '#059669');
        } else {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(0.6, '#a855f7');
          gradient.addColorStop(1, '#7e22ce');
        }

        ctx.fillStyle = gradient;
        // Rounded bar
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, barHeight / 2);
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 2, 2]);
        ctx.fill();

        // Glowing cap on active high frequencies
        if ((isPlaying || isStreaming) && normalized > 0.6) {
          ctx.shadowColor = accentColor === 'cyan' ? '#22d3ee' : '#34d399';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 1, y, barWidth - 2, 2);
          ctx.shadowBlur = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isStreaming, getFrequencyData, accentColor]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden py-1">
      <canvas
        ref={canvasRef}
        width={380}
        height={height}
        className="w-full max-w-md h-auto"
      />
    </div>
  );
};
