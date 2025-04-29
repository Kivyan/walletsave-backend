import { useEffect, useState, useRef } from 'react';

interface ScaleOptions {
  targetWidth?: number; // Largura de design base
  targetHeight?: number; // Altura de design base
  scaleWidth?: boolean; // Escalar horizontalmente
  scaleHeight?: boolean; // Escalar verticalmente
  maxScale?: number; // Limite máximo de escala
  minScale?: number; // Limite mínimo de escala
}

/**
 * Hook para calcular o fator de escala para ajustar o conteúdo à tela
 * Isso vai permitir que a interface se ajuste a qualquer tamanho de tela
 * sem precisar de scroll e sem cortar o conteúdo.
 */
export function useAutoScale({
  targetWidth = 375, // iPhone 8 width como base de design (comum para apps)
  targetHeight = 667, // iPhone 8 height como base de design
  scaleWidth = true,
  scaleHeight = true,
  maxScale = 1, // Não aumentar além do tamanho original em telas grandes
  minScale = 0.5, // Não diminuir mais que 50% em telas pequenas
}: ScaleOptions = {}) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Calcule as escalas para largura e altura
      const scaleX = scaleWidth ? containerWidth / targetWidth : 1;
      const scaleY = scaleHeight ? containerHeight / targetHeight : 1;

      // Use a menor escala para manter a proporção
      let newScale = Math.min(scaleX, scaleY);

      // Aplique limites
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      setScale(newScale);
    };

    // Calcula na montagem e reage ao redimensionamento
    updateScale();
    window.addEventListener('resize', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, [targetWidth, targetHeight, scaleWidth, scaleHeight, maxScale, minScale]);

  return { scale, containerRef };
}
