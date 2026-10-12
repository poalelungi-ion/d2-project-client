import { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { radii } from '../../../styles/tokens';

const HIGHSCORE_KEY = 'spa_profrun_highscore';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'student' | 'lectern' | 'plane';
  speed: number;
}

interface Collectible {
  x: number;
  y: number;
  type: 'ects_rupee' | 'coffee';
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export const ProfDinoGame = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [ectsBonus, setEctsBonus] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [semesterTitle, setSemesterTitle] = useState('Semester 1: Grundlagen');

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: 'jump' | 'pickup' | 'heal' | 'hit' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'pickup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880.0, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.setValueAtTime(310, now + 0.1);
        osc.frequency.setValueAtTime(260, now + 0.2);
        osc.frequency.setValueAtTime(200, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Internal game engine state
  const gameRef = useRef({
    active: false,
    paused: false,
    playerX: 52,
    playerY: 140,
    playerVy: 0,
    isJumping: false,
    groundY: 140,
    gravity: 0.52,
    jumpPower: -10.5,
    coyoteTimer: 0,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    nextObstacleTimer: 130, // Start with generous delay
    nextCollectibleTimer: 180,
    score: 0,
    ects: 0,
    lives: 3,
    invincibleTimer: 0,
    speed: 2.6, // Start gently and slowly!
    runningFrame: 0,
    highScore: 0,
    currentSemester: 'Semester 1: Grundlagen',
  });

  useEffect(() => {
    gameRef.current.highScore = highScore;
  }, [highScore]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const startGame = () => {
    gameRef.current = {
      active: true,
      paused: false,
      playerX: 52,
      playerY: 140,
      playerVy: 0,
      isJumping: false,
      groundY: 140,
      gravity: 0.52,
      jumpPower: -10.5,
      coyoteTimer: 0,
      obstacles: [],
      collectibles: [],
      particles: [],
      nextObstacleTimer: 140, // 2.5 seconds before first obstacle!
      nextCollectibleTimer: 100,
      score: 0,
      ects: 0,
      lives: 3,
      invincibleTimer: 0,
      speed: 2.6, // Gentle starter speed
      runningFrame: 0,
      highScore,
      currentSemester: 'Semester 1: Grundlagen',
    };

    setScore(0);
    setEctsBonus(0);
    setLives(3);
    setSemesterTitle('Semester 1: Grundlagen');
    setGameState('playing');
  };

  const jump = () => {
    const g = gameRef.current;
    if (!g.active) {
      startGame();
      return;
    }
    if (g.paused) return;

    if (!g.isJumping || g.coyoteTimer > 0) {
      g.playerVy = g.jumpPower;
      g.isJumping = true;
      g.coyoteTimer = 0;
      playSound('jump');

      // Spawn retro dust puff particles
      for (let i = 0; i < 6; i++) {
        g.particles.push({
          x: g.playerX + 12 + (Math.random() * 8 - 4),
          y: g.groundY + 34,
          vx: -(Math.random() * 2 + 1),
          vy: -(Math.random() * 1.5),
          color: '#cbd5e1',
          size: Math.floor(Math.random() * 3) + 2,
          life: 0,
          maxLife: 15,
        });
      }
    }
  };

  const togglePause = () => {
    const g = gameRef.current;
    if (!g.active || gameState === 'gameover') return;
    g.paused = !g.paused;
    setGameState(g.paused ? 'paused' : 'playing');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext ? canvas.getContext('2d') : null;
    } catch {
      return;
    }
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Crisp pixel art rendering
      ctx.imageSmoothingEnabled = false;

      // 1. Draw Zelda Dungeon/Classroom Background
      ctx.fillStyle = '#0b132b'; // Dark dungeon midnight
      ctx.fillRect(0, 0, width, height);

      // Stone brick background texture with parallax scroll
      const bgScroll = (Date.now() / 40) % 32;
      ctx.fillStyle = '#1c2541';
      for (let y = 10; y < g.groundY + 36; y += 18) {
        ctx.fillRect(0, y, width, 1);
        for (let x = -bgScroll; x < width; x += 32) {
          ctx.fillRect(x + ((y % 36 === 0) ? 16 : 0), y, 1, 18);
        }
      }

      // Parallax Chalkboard on wall
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, 20, width - 120, 52);
      ctx.strokeStyle = '#92400e'; // Wooden frame
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 20, width - 120, 52);

      // Chalk equations and Uni Hildesheim emblem on blackboard
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText('f(n) = O(n log n)  |  ∫ e^x dx = e^x + C  |  SUH 2003', 75, 42);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillText('GRADE >= 4.0 = PASS!  AVOID 5.0 REVIEWS!', 75, 58);

      // Animated torches on the wall
      const flameFlicker = Math.floor(Date.now() / 150) % 2;
      const torchXPositions = [35, width - 45];
      for (const tx of torchXPositions) {
        // Torch sconce bracket
        ctx.fillStyle = '#64748b';
        ctx.fillRect(tx, 45, 6, 12);
        // Flame
        ctx.fillStyle = flameFlicker === 0 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(tx - 1, 38, 8, 8);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(tx + 1, 40, 4, 5);
      }

      // Zelda Cobblestone Checkerboard Floor
      const floorY = g.groundY + 36;
      ctx.fillStyle = '#3a506b';
      ctx.fillRect(0, floorY, width, height - floorY);

      // Floor trim
      ctx.fillStyle = '#5bc0be';
      ctx.fillRect(0, floorY, width, 2);

      // Moving cobblestone floor tiles
      const floorScroll = (Date.now() / 12 * (g.speed / 2.6)) % 24;
      ctx.fillStyle = '#1c2541';
      for (let x = -floorScroll; x < width; x += 24) {
        ctx.fillRect(x, floorY + 4, 20, 10);
        ctx.fillRect(x + 12, floorY + 18, 20, 10);
      }

      // 2. Physics & Logic when Playing
      if (g.active && !g.paused) {
        g.playerVy += g.gravity;
        g.playerY += g.playerVy;

        if (g.playerY >= g.groundY) {
          g.playerY = g.groundY;
          g.playerVy = 0;
          g.isJumping = false;
          g.coyoteTimer = 4;
        } else {
          if (g.coyoteTimer > 0) g.coyoteTimer -= 1;
        }

        g.score += 1;
        g.runningFrame += 1;

        if (g.invincibleTimer > 0) {
          g.invincibleTimer -= 1;
        }

        // Speed increases gradually and smoothly: starts at 2.6, max 6.2
        g.speed = 2.6 + Math.min(3.6, Math.floor(g.score / 280) * 0.28);

        // Academic Semester Progression
        const currentMeters = Math.floor(g.score / 5);
        let semName = 'Semester 1: Grundlagen';
        if (currentMeters > 900) semName = 'Semester 6: Bachelor-Thesis Defense! 🎓';
        else if (currentMeters > 650) semName = 'Semester 5: Bachelor-Projekt';
        else if (currentMeters > 450) semName = 'Semester 4: Web & Cloud Engineering';
        else if (currentMeters > 280) semName = 'Semester 3: Software-Architektur';
        else if (currentMeters > 130) semName = 'Semester 2: Algorithmen & Datenstrukturen';

        if (semName !== g.currentSemester) {
          g.currentSemester = semName;
          setSemesterTitle(semName);
        }

        // Update React score every 6 frames
        if (g.score % 6 === 0) {
          setScore(currentMeters);
        }

        // 3. Spawn Obstacles
        g.nextObstacleTimer -= 1;
        if (g.nextObstacleTimer <= 0) {
          const types: Obstacle['type'][] = ['student', 'lectern', 'plane'];
          const chosen = types[Math.floor(Math.random() * types.length)];
          let obsW = 26;
          let obsH = 34;
          let obsY = floorY - obsH;

          if (chosen === 'lectern') {
            obsW = 30;
            obsH = 28;
            obsY = floorY - obsH;
          } else if (chosen === 'plane') {
            obsW = 28;
            obsH = 18;
            obsY = floorY - 38; // In the air! Can duck or jump timing
          }

          g.obstacles.push({
            x: width + 20,
            y: obsY,
            width: obsW,
            height: obsH,
            type: chosen,
            speed: g.speed,
          });

          // Randomized timer adapts with speed but stays fair
          const baseInterval = Math.max(70, 140 - Math.floor(g.score / 350) * 12);
          g.nextObstacleTimer = baseInterval + Math.floor(Math.random() * 50);
        }

        // 4. Spawn Collectibles (ECTS Rupees / Coffee)
        g.nextCollectibleTimer -= 1;
        if (g.nextCollectibleTimer <= 0) {
          const isCoffee = g.lives < 3 && Math.random() < 0.35;
          const collectY = g.groundY - (Math.random() < 0.5 ? 18 : 36);

          g.collectibles.push({
            x: width + 30,
            y: collectY,
            type: isCoffee ? 'coffee' : 'ects_rupee',
            collected: false,
          });

          g.nextCollectibleTimer = Math.floor(Math.random() * 120) + 140;
        }

        // 5. Update & Collect Collectibles
        for (let i = g.collectibles.length - 1; i >= 0; i--) {
          const item = g.collectibles[i];
          item.x -= g.speed;

          // Pickup check
          const px = g.playerX;
          const py = g.playerY;
          if (
            !item.collected &&
            px < item.x + 20 &&
            px + 28 > item.x &&
            py < item.y + 20 &&
            py + 36 > item.y
          ) {
            item.collected = true;
            if (item.type === 'coffee') {
              if (g.lives < 3) {
                g.lives += 1;
                setLives(g.lives);
              }
              playSound('heal');
            } else {
              g.ects += 5;
              setEctsBonus(g.ects);
              playSound('pickup');
            }

            // Sparkle particles
            for (let p = 0; p < 8; p++) {
              g.particles.push({
                x: item.x + 8,
                y: item.y + 8,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: item.type === 'coffee' ? '#f59e0b' : '#22c55e',
                size: 3,
                life: 0,
                maxLife: 20,
              });
            }
          }

          if (item.x < -30 || item.collected) {
            g.collectibles.splice(i, 1);
          }
        }

        // 6. Move & Filter Obstacles + Collision Detection
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed;

          // Pixel collision box
          const playerBox = {
            x: g.playerX + 4,
            y: g.playerY + 4,
            width: 20,
            height: 30,
          };

          const padding = 5;
          const hit =
            playerBox.x < obs.x + obs.width - padding &&
            playerBox.x + playerBox.width > obs.x + padding &&
            playerBox.y < obs.y + obs.height - padding &&
            playerBox.y + playerBox.height > obs.y + padding;

          if (hit && g.invincibleTimer === 0) {
            // Heart Damage
            g.lives -= 1;
            setLives(g.lives);
            g.invincibleTimer = 60; // 1 second of i-frames!
            playSound('hit');

            // Hit spark particles
            for (let p = 0; p < 10; p++) {
              g.particles.push({
                x: g.playerX + 14,
                y: g.playerY + 16,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#ef4444',
                size: 3,
                life: 0,
                maxLife: 20,
              });
            }

            if (g.lives <= 0) {
              // Game Over
              g.active = false;
              setGameState('gameover');
              playSound('gameover');
              const finalMeters = Math.floor(g.score / 5) + g.ects;
              setScore(finalMeters);
              if (finalMeters > g.highScore) {
                setHighScore(finalMeters);
                try {
                  localStorage.setItem(HIGHSCORE_KEY, String(finalMeters));
                } catch {}
              }
            }
          }

          if (obs.x + obs.width < -30) {
            g.obstacles.splice(i, 1);
          }
        }

        // 7. Update Particles
        for (let p = g.particles.length - 1; p >= 0; p--) {
          const pt = g.particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life += 1;
          if (pt.life >= pt.maxLife) {
            g.particles.splice(p, 1);
          }
        }
      }

      // 8. Render Collectibles (Zelda Rupees & Coffee)
      for (const item of g.collectibles) {
        if (item.type === 'ects_rupee') {
          // Pixel Green Rupee
          const rx = item.x;
          const ry = item.y;
          ctx.fillStyle = '#15803d'; // Dark edge
          ctx.fillRect(rx + 4, ry, 6, 2);
          ctx.fillRect(rx + 2, ry + 2, 10, 2);
          ctx.fillRect(rx, ry + 4, 14, 8);
          ctx.fillRect(rx + 2, ry + 12, 10, 2);
          ctx.fillRect(rx + 4, ry + 14, 6, 2);

          ctx.fillStyle = '#22c55e'; // Bright green
          ctx.fillRect(rx + 4, ry + 2, 6, 12);
          ctx.fillRect(rx + 2, ry + 4, 10, 8);

          ctx.fillStyle = '#bbf7d0'; // Highlight shine
          ctx.fillRect(rx + 4, ry + 3, 3, 4);
        } else {
          // Pixel Coffee Mug (Heals 1 Heart)
          const cx = item.x;
          const cy = item.y;
          ctx.fillStyle = '#ffffff'; // White ceramic mug
          ctx.fillRect(cx, cy + 4, 12, 12);
          // Handle
          ctx.fillRect(cx + 12, cy + 6, 4, 8);
          ctx.fillStyle = '#0b132b';
          ctx.fillRect(cx + 12, cy + 8, 2, 4);
          // Hot coffee liquid inside
          ctx.fillStyle = '#78350f';
          ctx.fillRect(cx + 2, cy + 5, 8, 2);
          // Rising steam
          const steamToggle = Math.floor(Date.now() / 200) % 2;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(cx + 4 + steamToggle, cy, 2, 3);
          ctx.fillRect(cx + 7 - steamToggle, cy - 2, 2, 3);
        }
      }

      // 9. Render Obstacles (Pixel Art Students & Exam Booklets)
      for (const obs of g.obstacles) {
        if (obs.type === 'student') {
          // Retro Pixel Student in Purple Hoodie
          const sx = obs.x;
          const sy = obs.y;

          // Hair & Head
          ctx.fillStyle = '#b45309'; // Brown hair
          ctx.fillRect(sx + 6, sy, 12, 6);
          ctx.fillStyle = '#fde047'; // Skin
          ctx.fillRect(sx + 7, sy + 6, 10, 6);
          // Eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sx + 13, sy + 7, 2, 2);

          // Purple Hoodie Body
          ctx.fillStyle = '#7c3aed';
          ctx.fillRect(sx + 4, sy + 12, 16, 12);

          // Pants & Boots
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx + 5, sy + 24, 6, 8);
          ctx.fillRect(sx + 13, sy + 24, 6, 8);

          // Stumbling Outstretched Hand holding "5.0" Exam Paper
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx + 17, sy + 10, 11, 14);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx + 17, sy + 10, 11, 14);

          // Red "5.0" Fail Stamp
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('5.0', sx + 18, sy + 20);
        } else if (obs.type === 'lectern') {
          // Wooden Exam Lectern with Piles of Failed Papers
          const lx = obs.x;
          const ly = obs.y;

          // Wooden Podium
          ctx.fillStyle = '#92400e';
          ctx.fillRect(lx + 4, ly + 10, 22, 18);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(lx + 2, ly + 8, 26, 4);

          // Giant Red Stamp Sign
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(lx + 6, ly, 18, 10);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('FAIL', lx + 8, ly + 8);
        } else {
          // Flying 5.0 Paper Airplane gliding through the air
          const px = obs.x;
          const py = obs.y;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(px, py + 8);
          ctx.lineTo(px + 22, py);
          ctx.lineTo(px + 16, py + 14);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('5.0', px + 7, py + 10);
        }
      }

      // 10. Render Particles
      for (const pt of g.particles) {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }

      // 11. Render Player: Zelda-style Scholar Professor
      const px = g.playerX;
      const py = g.playerY;

      // Invulnerability flicker effect (every 4 frames)
      const isFlickering = g.invincibleTimer > 0 && Math.floor(g.invincibleTimer / 4) % 2 === 1;

      if (!isFlickering) {
        // Pointed Academic Wizard / Scholar Cap (Zelda Link Green with Gold Tassel)
        ctx.fillStyle = '#15803d'; // Cap base
        ctx.fillRect(px + 6, py + 1, 14, 5);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(px + 10, py - 4, 8, 5);
        ctx.fillStyle = '#eab308'; // Gold Tassel
        ctx.fillRect(px + 16, py - 3, 3, 3);
        ctx.fillRect(px + 18, py, 2, 4);

        // Face & Silver Beard
        ctx.fillStyle = '#fed7aa'; // Skin tone
        ctx.fillRect(px + 8, py + 6, 12, 8);
        // Expressive Pixel Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 15, py + 8, 2, 3);
        ctx.fillStyle = '#38bdf8'; // Blue Spectacles / Glasses
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px + 13, py + 7, 5, 4);

        // Bushy Professor Beard
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 10, py + 12, 10, 5);
        ctx.fillRect(px + 12, py + 16, 6, 3);

        // Scholar Tunic / Academic Robe (Forest Green with Gold Trim)
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(px + 6, py + 17, 16, 12);
        // Gold Chest Trim
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 13, py + 17, 2, 7);

        // Brown Leather Belt with Gold Buckle
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 6, py + 25, 16, 3);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 12, py + 25, 4, 3);

        // Hand holding a rolled academic scroll / diploma
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 20, py + 19, 6, 8);
        ctx.fillStyle = '#dc2626'; // Red Ribbon on diploma
        ctx.fillRect(px + 22, py + 22, 2, 2);

        // Running / Jumping Boots
        ctx.fillStyle = '#451a03'; // Dark leather boots
        if (g.isJumping) {
          // Tucked knees jump pose
          ctx.fillRect(px + 4, py + 29, 6, 6);
          ctx.fillRect(px + 18, py + 27, 6, 6);
        } else {
          // Animated 4-frame run cycle
          const runStep = Math.floor(g.runningFrame / 4) % 4;
          if (runStep === 0) {
            ctx.fillRect(px + 4, py + 29, 6, 7);
            ctx.fillRect(px + 16, py + 29, 6, 7);
          } else if (runStep === 1) {
            ctx.fillRect(px + 8, py + 29, 6, 6);
            ctx.fillRect(px + 18, py + 27, 6, 5);
          } else if (runStep === 2) {
            ctx.fillRect(px + 14, py + 29, 6, 7);
            ctx.fillRect(px + 6, py + 29, 6, 7);
          } else {
            ctx.fillRect(px + 2, py + 27, 6, 5);
            ctx.fillRect(px + 12, py + 29, 6, 6);
          }
        }
      }

      // 12. Retro HUD: 3 Zelda Heart Containers (Top Left)
      const heartStartX = 14;
      const heartY = 12;
      for (let h = 0; h < 3; h++) {
        const hx = heartStartX + h * 18;
        const isFilled = h < g.lives;

        // Pixel Heart Outline
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx + 2, heartY, 4, 1);
        ctx.fillRect(hx + 8, heartY, 4, 1);
        ctx.fillRect(hx + 1, heartY + 1, 6, 1);
        ctx.fillRect(hx + 7, heartY + 1, 6, 1);
        ctx.fillRect(hx, heartY + 2, 14, 4);
        ctx.fillRect(hx + 1, heartY + 6, 12, 2);
        ctx.fillRect(hx + 2, heartY + 8, 10, 2);
        ctx.fillRect(hx + 4, heartY + 10, 6, 2);
        ctx.fillRect(hx + 6, heartY + 12, 2, 1);

        if (isFilled) {
          // Red Heart Interior
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(hx + 2, heartY + 1, 3, 2);
          ctx.fillRect(hx + 8, heartY + 1, 3, 2);
          ctx.fillRect(hx + 1, heartY + 3, 12, 3);
          ctx.fillRect(hx + 2, heartY + 6, 10, 2);
          ctx.fillRect(hx + 3, heartY + 8, 8, 1);
          ctx.fillRect(hx + 5, heartY + 9, 4, 1);
          // Highlight shine
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(hx + 2, heartY + 2, 2, 2);
        } else {
          // Empty Heart Dark Interior
          ctx.fillStyle = '#334155';
          ctx.fillRect(hx + 2, heartY + 2, 10, 6);
        }
      }

      // ECTS Rupee Counter in HUD
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(`ECTS: +${g.ects}`, 76, 22);

      // Score and High Score in Retro Arcade font (Top Right)
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillText(`DISTANCE: ${Math.floor(g.score / 5)}m`, width - 150, 22);

      if (g.highScore > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`HI: ${g.highScore}m`, width - 240, 22);
      }

      // Idle Screen Prompt
      if (!g.active && gameState === 'idle') {
        ctx.fillStyle = 'rgba(11, 19, 43, 0.75)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ PROF RUN: ZELDA EXAM HALL SPRINT ⚔️', width / 2, 60);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('Press SPACE, UP, or CLICK to Jump! Collect ECTS & Coffee!', width / 2, 88);
        ctx.fillText('Leap over students appealing their failed 5.0 exam grades.', width / 2, 108);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('3 Hearts | Gradual Speedup | Fullscreen & Audio Controls', width / 2, 134);
        ctx.textAlign = 'left';
      }

      // Paused Overlay
      if (g.paused) {
        ctx.fillStyle = 'rgba(11, 19, 43, 0.8)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED (Press P to Resume)', width / 2, 95);
        ctx.textAlign = 'left';
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, soundEnabled]);

  return (
    <Paper
      ref={containerRef}
      variant="outlined"
      sx={{
        p: isFullscreen ? 3 : 2.5,
        borderRadius: isFullscreen ? 0 : radii.xl,
        bgcolor: '#060a17',
        color: '#f8fafc',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isFullscreen ? 'center' : 'flex-start',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Game Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsEsportsIcon sx={{ color: '#22c55e' }} />
          <Typography variant="subtitle1" fontWeight="800" sx={{ letterSpacing: 0.5, fontFamily: 'monospace' }}>
            Prof Run: Zelda Exam Quest
          </Typography>
          <Chip
            label={semesterTitle}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.72rem',
              bgcolor: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Heart indicators in UI */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mr: 1 }}>
            {[0, 1, 2].map((i) => (
              <FavoriteIcon
                key={i}
                sx={{
                  fontSize: 18,
                  color: i < lives ? '#ef4444' : '#334155',
                  filter: i < lives ? 'drop-shadow(0 0 4px #ef4444)' : 'none',
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f59e0b', mr: 1 }}>
            <EmojiEventsIcon fontSize="small" />
            <Typography variant="caption" fontWeight="700" sx={{ fontFamily: 'monospace' }}>
              HI: {highScore}m
            </Typography>
          </Box>

          <Chip
            label={`${score}m (+${ectsBonus} ECTS)`}
            size="small"
            sx={{
              fontWeight: 800,
              fontFamily: 'monospace',
              bgcolor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
            }}
          />

          {/* Sound Toggle Button */}
          <Tooltip title={soundEnabled ? 'Mute 8-Bit Audio (M)' : 'Enable 8-Bit Audio (M)'}>
            <IconButton
              size="small"
              onClick={toggleSound}
              sx={{ color: soundEnabled ? '#22c55e' : '#64748b' }}
            >
              {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Pause Button */}
          {gameState === 'playing' && (
            <Tooltip title="Pause (P)">
              <IconButton size="small" onClick={togglePause} sx={{ color: '#94a3b8' }}>
                <PauseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {gameState === 'paused' && (
            <Tooltip title="Resume (P)">
              <IconButton size="small" onClick={togglePause} sx={{ color: '#4ade80' }}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Fullscreen Button */}
          <Tooltip title={isFullscreen ? 'Exit Fullscreen (F)' : 'Play Fullscreen (F)'}>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{ color: isFullscreen ? '#38bdf8' : '#cbd5e1' }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Retro Pixel Canvas Area */}
      <Box
        sx={{
          borderRadius: radii.lg,
          overflow: 'hidden',
          border: '2px solid #334155',
          cursor: 'pointer',
          position: 'relative',
          bgcolor: '#0b132b',
          flex: isFullscreen ? 1 : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={jump}
      >
        <canvas
          ref={canvasRef}
          width={720}
          height={200}
          style={{
            width: '100%',
            height: isFullscreen ? '100%' : 200,
            maxHeight: isFullscreen ? 'calc(100vh - 120px)' : 200,
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(11, 19, 43, 0.88)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Typography
              variant="h6"
              fontWeight="900"
              sx={{
                color: '#ef4444',
                mb: 0.5,
                fontFamily: 'monospace',
                letterSpacing: 1,
              }}
            >
              ☠️ EXAM GRADE 5.0 CAUGHT YOU! ☠️
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2, fontFamily: 'monospace' }}>
              Survived up to <strong>{semesterTitle}</strong> with{' '}
              <strong style={{ color: '#38bdf8' }}>{score} meters</strong> and{' '}
              <strong style={{ color: '#4ade80' }}>+{ectsBonus} bonus ECTS</strong>.
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<RestartAltIcon />}
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              sx={{
                textTransform: 'none',
                borderRadius: radii.md,
                px: 3,
                fontWeight: 800,
                fontFamily: 'monospace',
                bgcolor: '#16a34a',
                '&:hover': { bgcolor: '#15803d' },
              }}
            >
              Start New Semester (Space)
            </Button>
          </Box>
        )}
      </Box>

      {/* Footer controls & hints */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
          Controls: <strong>Space / Up Arrow</strong> Jump | <strong>F</strong> Fullscreen | <strong>M</strong> Audio | <strong>P</strong> Pause
        </Typography>
        {gameState !== 'playing' && (
          <Button
            size="small"
            variant="text"
            onClick={startGame}
            sx={{ color: '#4ade80', textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}
          >
            Start Adventure
          </Button>
        )}
      </Box>
    </Paper>
  );
};
