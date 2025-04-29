import React, { ReactNode } from 'react';
import { useAutoScale } from '@/hooks/use-auto-scale';

interface AutoScaleContainerProps {
  children: ReactNode;
  className?: string;
  targetWidth?: number;
  targetHeight?: number;
  minScale?: number;
  maxScale?: number;
}

/**
 * Componente que automaticamente escala seu conteúdo para caber na tela
 * sem precisar de scroll, mantendo a proporção original.
 */
export function AutoScaleContainer({
  children,
  className = '',
  targetWidth,
  targetHeight,
  minScale,
  maxScale,
}: AutoScaleContainerProps) {
  const { scale, containerRef } = useAutoScale({
    targetWidth,
    targetHeight,
    minScale,
    maxScale,
  });

  return (
    <div className={`app-container ${className}`} ref={containerRef}>
      <div 
        className="auto-scale-content"
        style={{
          height: targetHeight ? `${targetHeight}px` : '100%',
          width: targetWidth ? `${targetWidth}px` : '100%',
          // Centraliza o conteúdo escalado em telas maiores
          position: 'absolute',
          top: '50%',
          left: '50%',
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
