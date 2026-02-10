import { useEffect, useRef } from 'react';

/**
 * Background Animado com Globo Conectado
 * Inspirado no Stripe - rede de conexões globais
 */
export default function ConnectedGlobeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes = [];
    const nodeCount = 20;

    // Criar nós (pontos)
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    const connectionDistance = 150;
    let animationId;

    const animate = () => {
      // Limpar canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Atualizar nós
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce nas bordas
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });

      // Desenhar conexões
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Desenhar nós
      nodes.forEach((node) => {
        // Glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Responsividade
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40 dark:opacity-60"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 dark:from-slate-900/0 via-white/0 dark:via-slate-900/0 to-white/50 dark:to-slate-900/50" />
    </div>
  );
}

/**
 * Versão SVG do globo com conexões
 * Mais leve e precisa que canvas
 */
export function GlobalNetworkSVG() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-20 dark:opacity-40 pointer-events-none"
      viewBox="0 0 1200 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{`
          @keyframes float-node {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(20px, -15px); }
            50% { transform: translate(-10px, 20px); }
            75% { transform: translate(15px, -10px); }
          }
          .network-node {
            animation: float-node 12s ease-in-out infinite;
            transform-origin: center;
          }
          @keyframes pulse-connection {
            0%, 100% { opacity: 0.3; stroke-width: 1; }
            50% { opacity: 0.6; stroke-width: 1.5; }
          }
          .connection-line {
            animation: pulse-connection 4s ease-in-out infinite;
            stroke: rgb(59, 130, 246);
          }
        `}</style>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Linhas de conexão */}
      <line x1="100" y1="100" x2="400" y2="300" className="connection-line" strokeWidth="1" />
      <line x1="400" y1="300" x2="800" y2="150" className="connection-line" strokeWidth="1" />
      <line x1="800" y1="150" x2="1000" y2="500" className="connection-line" strokeWidth="1" />
      <line x1="1000" y1="500" x2="200" y2="550" className="connection-line" strokeWidth="1" />
      <line x1="200" y1="550" x2="100" y2="100" className="connection-line" strokeWidth="1" />

      {/* Nós */}
      <g className="network-node" style={{ animationDelay: '0s' }}>
        <circle cx="100" cy="100" r="8" fill="rgb(59, 130, 246)" filter="url(#glow)" />
      </g>
      <g className="network-node" style={{ animationDelay: '2s' }}>
        <circle cx="400" cy="300" r="8" fill="rgb(59, 130, 246)" filter="url(#glow)" />
      </g>
      <g className="network-node" style={{ animationDelay: '4s' }}>
        <circle cx="800" cy="150" r="8" fill="rgb(59, 130, 246)" filter="url(#glow)" />
      </g>
      <g className="network-node" style={{ animationDelay: '6s' }}>
        <circle cx="1000" cy="500" r="8" fill="rgb(59, 130, 246)" filter="url(#glow)" />
      </g>
      <g className="network-node" style={{ animationDelay: '8s' }}>
        <circle cx="200" cy="550" r="8" fill="rgb(59, 130, 246)" filter="url(#glow)" />
      </g>
    </svg>
  );
}
