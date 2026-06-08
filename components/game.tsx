'use client';

import { useEffect, useRef, useState } from 'react';

// --- Game Constants & Keep Physics Solid ---
const GRAVITY = 0.65;
const JUMP_STRENGTH = -12.5;
const BASE_SPEED = 6.2;
const SPEED_INCREMENT = 0.001;
const SPAWN_MIN_DISTANCE = 340;
const SPAWN_MAX_DISTANCE = 710;
const LIGHT_BOTTLE_PARTICLE_COLOR = '#8F8F82';
const DARK_BOTTLE_PARTICLE_COLOR = '#D8D8CF';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  isGrounded: boolean;
  rotation: number;
  isCrouching: boolean;
  crouchTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 
    | 'bookstack'
    | 'chair'
    | 'scissors'
    | 'standingpencil'
    | 'clock'
    | 'table'
    | 'crayons'
    | 'backpack'
    | 'paperplane'
    | 'rocket';
  passed: boolean;
  isFlying: boolean;
  heightLevel?: 1 | 2 | 3;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface GameProps {
  onNightModeChange?: (isNightMode: boolean) => void;
}

const getScale = (): number => {
  if (typeof window === 'undefined') return 1.0;
  return window.innerWidth < 768 ? 0.8 : 1.0;
};

export default function Game({ onNightModeChange }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States for React rendering
  const [gameState, setGameState] = useState<GameState>('START');
  const gameStateRef = useRef<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Ref-based Game Loop State for precision physics (60FPS matching)
  const playerRef = useRef<Player>({
    x: 70,
    y: 152,
    width: 24,
    height: 48,
    velocity: 0,
    isGrounded: true,
    rotation: 0,
    isCrouching: false,
    crouchTimer: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);
  const lastScoreRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const reqRef = useRef<number>(0);

  // Keyboard / Touch status pointers for variable height mechanics
  const isJumpingKeyHeld = useRef(false);
  const isCrouchKeyHeld = useRef(false);

  // Speed-based night mode state
  const [isNightMode, setIsNightMode] = useState(false);
  const isNightModeRef = useRef(false);

  // Load High Score on Mount
  useEffect(() => {
    const stored = window.localStorage.getItem('aquaflip_highscore');
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  const changeGameState = (newState: GameState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  };

  const startGame = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    const scale = getScale();
    playerRef.current = {
      x: 70,
      y: canvas.height - Math.round(100 / scale) - 48, // 100 is groundY offset, 48 is normal height
      width: 24,
      height: 48,
      velocity: 0,
      isGrounded: true,
      rotation: 0,
      isCrouching: false,
      crouchTimer: 0
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    frameRef.current = 0;
    scoreRef.current = 0;
    lastScoreRef.current = 0;
    speedRef.current = BASE_SPEED;
    
    isJumpingKeyHeld.current = false;
    isCrouchKeyHeld.current = false;
    
    setScore(0);
    isNightModeRef.current = false;
    setIsNightMode(false);
    if (onNightModeChange) {
      onNightModeChange(false);
    }
    changeGameState('PLAYING');
  };

  const spawnJumpParticles = () => {
    const p = playerRef.current;
    const particleColor = isNightModeRef.current ? DARK_BOTTLE_PARTICLE_COLOR : LIGHT_BOTTLE_PARTICLE_COLOR;
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: p.x + p.width / 2 + (Math.random() - 0.5) * 12,
        y: p.y + p.height,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        color: particleColor
      });
    }
  };

  const spawnLandingParticles = () => {
    const p = playerRef.current;
    const particleColor = isNightModeRef.current ? DARK_BOTTLE_PARTICLE_COLOR : LIGHT_BOTTLE_PARTICLE_COLOR;
    for (let i = 0; i < 7; i++) {
      particlesRef.current.push({
        x: p.x + p.width / 2 + (Math.random() - 0.5) * 18,
        y: p.y + p.height,
        vx: (Math.random() - 0.5) * 4.5,
        vy: -Math.random() * 1.5,
        life: 0,
        maxLife: 15 + Math.random() * 8,
        color: particleColor
      });
    }
  };

  const createObstacle = (canvas: HTMLCanvasElement) => {
    const types: Obstacle['type'][] = [
      'bookstack', 'chair', 'backpack', 'scissors', 'standingpencil', 'clock', // Small or medium ground
      'table', 'crayons', // Long ground
      'paperplane', 'paperplane', 'paperplane', // Flying - heavy on paper planes
      'rocket' // Flying - rare rocket
    ];
    // Custom weight biased randomization
    const type = types[Math.floor(Math.random() * types.length)];
    
    let width = 0;
    let height = 0;
    let isFlying = false;
    
    let widthMultiplier = 1.0;
    const currentSpeed = speedRef.current;
    if (currentSpeed > BASE_SPEED) {
      widthMultiplier = 1.0 + Math.min(0.35, (currentSpeed - BASE_SPEED) * 0.07);
    }
    
    switch (type) {
      // Small ground
      case 'bookstack': width = 36; height = 28; break;
      case 'chair': width = 30; height = 44; break;
      case 'scissors': width = 32; height = 25; break;
      case 'standingpencil': width = 12; height = 48; break;
      case 'clock': width = 32; height = 32; break;
      case 'backpack': width = 46; height = 50; break;
      // Long ground
      case 'table': width = Math.round(120 * widthMultiplier); height = 34; break;
      case 'crayons': width = Math.round(105 * widthMultiplier); height = 36; break;
      // Flying
      case 'paperplane': 
        width = 44; 
        height = 14; 
        isFlying = true; 
        break;
      case 'rocket': 
        width = 48; 
        height = 16; 
        isFlying = true; 
        break;
    }
    
    const scale = getScale();
    const groundY = canvas.height - Math.round(100 / scale);
    let y = groundY - height;
    let heightLevel: 1 | 2 | 3 | undefined;
    
    // Position airborne fly obstacles at one of 2 heights
    if (isFlying) {
      const rand = Math.random();
      if (rand < 0.25) {
        // Height 1 (High): Standing or crouching passes, jump collides
        heightLevel = 1;
        y = groundY - height - 55;
      } else {
        // Height 2 (Medium, common): Jump or stay low (crouch) passes, standing collides
        heightLevel = 2;
        y = groundY - height - 26;
      }
    }
    
    obstaclesRef.current.push({
      x: canvas.width,
      y,
      width,
      height,
      type,
      passed: false,
      isFlying,
      heightLevel
    });
  };

  // Unified Input Handler for Keyboard and Touch Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent OS repeat key triggers from overriding crouch timer
      if (gameStateRef.current === 'START' || gameStateRef.current === 'GAMEOVER') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      const p = playerRef.current;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        isJumpingKeyHeld.current = true;
        if (p.isGrounded && !p.isCrouching) {
          p.velocity = JUMP_STRENGTH;
          p.isGrounded = false;
          p.rotation = 0; // initialize backflip
          spawnJumpParticles();
        }
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        isCrouchKeyHeld.current = true;
        if (!p.isGrounded) {
          // Air-dive/plummet
          p.velocity = 11;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        isJumpingKeyHeld.current = false;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        isCrouchKeyHeld.current = false;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      if (gameStateRef.current === 'START' || gameStateRef.current === 'GAMEOVER') {
        startGame();
        return;
      }

      isJumpingKeyHeld.current = true;
      const p = playerRef.current;
      if (gameStateRef.current === 'PLAYING' && p.isGrounded && !p.isCrouching) {
        p.velocity = JUMP_STRENGTH;
        p.isGrounded = false;
        p.rotation = 0; // initialize backflip
        spawnJumpParticles();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isJumpingKeyHeld.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Main Game Loop & Animations (60 FPS Canvas render core)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const scale = getScale();
        canvas.width = Math.round(containerRef.current.offsetWidth / scale);
        canvas.height = Math.round(300 / scale); 
        
        if (gameStateRef.current === 'START') {
          const groundY = canvas.height - Math.round(100 / scale);
          playerRef.current.y = groundY - playerRef.current.height;
        }
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = () => {
      reqRef.current = requestAnimationFrame(gameLoop);
      
      if (gameStateRef.current !== 'PLAYING') {
         drawBackground(ctx, canvas);
         drawPlayer(ctx, playerRef.current);
         return;
      }

      update(canvas);
      draw(ctx, canvas);
    };

    const update = (canvas: HTMLCanvasElement) => {
      const p = playerRef.current;
      const groundY = canvas.height - Math.round(100 / getScale());

      // Update Player Core States
      if (isCrouchKeyHeld.current && p.isGrounded) {
         p.isCrouching = true;
         p.width = 44;
         p.height = 20;
         p.y = groundY - 20;
         p.velocity = 0;
         p.rotation = 0;
      } else {
         if (p.isCrouching) {
            p.isCrouching = false;
            p.width = 24;
            p.height = 48;
            p.y = groundY - 48;
         }

         // Variable Jump Heights: Halt upward velocity if button/touch is released early
         if (!isJumpingKeyHeld.current && p.velocity < -3.5) {
            p.velocity = -3.5;
         }

         p.velocity += GRAVITY;
         p.y += p.velocity;

         // Smooth beautiful backflip jump animation matching exact rotation timeline
         if (!p.isGrounded) {
            p.rotation += 0.145; // ~360 spin during ~43 frame gravity vector
         } else {
            p.rotation = 0;
         }

         if (p.y + p.height >= groundY) {
           p.y = groundY - p.height;
           p.velocity = 0;
           if (!p.isGrounded) {
               p.isGrounded = true;
               p.rotation = 0;
               spawnLandingParticles();
           }
         }
      }

      // Update Speed
      speedRef.current += SPEED_INCREMENT;

      // Check score-based night mode transitions (switching every 1000 points starting at 1000)
      if (gameStateRef.current === 'PLAYING') {
        const scoreVal = Math.floor(scoreRef.current);
        let targetNightMode = false;
        if (scoreVal >= 1000) {
          const segment = Math.floor((scoreVal - 1000) / 1000);
          targetNightMode = (segment % 2 === 0);
        }
        if (targetNightMode !== isNightModeRef.current) {
          isNightModeRef.current = targetNightMode;
          setIsNightMode(targetNightMode);
          if (onNightModeChange) {
            onNightModeChange(targetNightMode);
          }
        }
      }
      
      // Handle spawns
      if (frameRef.current <= 0) {
        createObstacle(canvas);
        const minFrames = Math.max(28, Math.round(SPAWN_MIN_DISTANCE / speedRef.current));
        const maxFrames = Math.max(45, Math.round(SPAWN_MAX_DISTANCE / speedRef.current));
        frameRef.current = minFrames + Math.random() * (maxFrames - minFrames);
      }
      frameRef.current--;

      // Process Obestacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speedRef.current;

        // Custom Rocket Trail Particles
        if (obs.type === 'rocket' && Math.random() < 0.35) {
           particlesRef.current.push({
             x: obs.x + obs.width,
             y: obs.y + obs.height / 2 + (Math.random() - 0.5) * 8,
             vx: speedRef.current * 0.45 + Math.random() * 2.5,
             vy: (Math.random() - 0.5) * 1.5,
             life: 0,
             maxLife: 16 + Math.random() * 10,
             color: Math.random() < 0.55 ? '#D15E5E' : '#E8B85A'
           });
        }

        // Collision Check using forgiving slightly shaved bound boxes
        const paddingX = 4;
        const paddingY = 4;
        
        if (
          p.x + p.width - paddingX > obs.x &&
          p.x + paddingX < obs.x + obs.width &&
          p.y + p.height - paddingY > obs.y &&
          p.y + paddingY < obs.y + obs.height
        ) {
          gameOver();
          return;
        }

        // Register score triggers
        if (!obs.passed && p.x > obs.x + obs.width) {
          obs.passed = true;
        }

        if (obs.x + obs.width < -120) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Calculate survival score over timeframe
      scoreRef.current += 0.1 * (speedRef.current / BASE_SPEED);
      if (Math.floor(scoreRef.current) > lastScoreRef.current) {
        lastScoreRef.current = Math.floor(scoreRef.current);
        setScore(lastScoreRef.current);
      }

      // Run aesthetic scene particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const part = particlesRef.current[i];
        part.x += part.vx - (speedRef.current * 0.5); 
        part.y += part.vy;
        part.life++;
        if (part.life >= part.maxLife) {
            particlesRef.current.splice(i, 1);
        }
      }
    };

    const gameOver = () => {
      isNightModeRef.current = false;
      setIsNightMode(false);
      if (onNightModeChange) {
        onNightModeChange(false);
      }
      changeGameState('GAMEOVER');
      const finalScore = Math.floor(scoreRef.current);
      setHighScore((prevObj) => {
         const hp = Math.max(prevObj, finalScore);
         localStorage.setItem('aquaflip_highscore', hp.toString());
         return hp;
      });
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const isNm = isNightModeRef.current;
        // Natural Tone background
        ctx.fillStyle = isNm ? '#1C1C18' : '#F5F5F0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const groundY = canvas.height - Math.round(100 / getScale());
        
        // Solid desk outline separator
        ctx.strokeStyle = isNm ? '#3C3C34' : '#D8D8CF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        const isNm = isNightModeRef.current;
        const outlineColor = isNm ? '#E1E1D7' : '#434338';
        const labelColor = isNm ? '#A5A599' : '#5A5A40';

        ctx.save();
        ctx.translate(p.x + p.width/2, p.y + p.height/2);
        
        if (p.isCrouching) {
             const bw = p.width; // 44
             const bh = p.height; // 20
             
             // Sliding scratch particle effect
             if (gameStateRef.current === 'PLAYING' && Math.random() < 0.25) {
                particlesRef.current.push({
                  x: p.x + (Math.random() - 0.2) * p.width,
                  y: p.y + p.height + 4,
                  vx: -speedRef.current * 0.45 - Math.random() * 2,
                  vy: -Math.random() * 1.5,
                  life: 0,
                  maxLife: 12 + Math.random() * 8,
                  color: isNm ? '#3C3C34' : LIGHT_BOTTLE_PARTICLE_COLOR
                });
             }

             // Render Horizontal Slide/Lying Water Bottle
             ctx.fillStyle = isNm ? '#2C2C24' : '#FFFFFF';
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.roundRect(-bw/2 + 8, -bh/2, bw - 8, bh, [4, 6, 6, 4]);
             ctx.fill();
             ctx.stroke();

             // Cap facing right
             ctx.fillStyle = outlineColor;
             ctx.fillRect(bw/2 - 4, -bh/2 + 4, 4, bh - 8);

             // Retro Handle loop back
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.arc(-bw/2 + 6, -bh/2 + 6, 5, Math.PI/2, (3 * Math.PI)/2);
             ctx.stroke();

             // Cute logo inscription
             ctx.fillStyle = labelColor;
             ctx.font = 'bold 7px Arial';
             ctx.fillText('32oz', -bw/2 + 11, bh/2 - 4);

        } else {
             if (!p.isGrounded) {
                  // Spin backflip animation
                  ctx.rotate(p.rotation);
             } else if (gameStateRef.current === 'PLAYING') {
                 // Cute running bob trace
                 const bob = Math.sin(Date.now() / 90) * 1.5;
                 ctx.translate(0, bob);
             }

             // Draw Standing White Aquaflask
             const bw = p.width;
             const bh = p.height;
             
             // Body
             ctx.fillStyle = isNm ? '#2C2C24' : '#FFFFFF';
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.roundRect(-bw/2, -bh/2 + 8, bw, bh - 8, [6, 6, 4, 4]);
             ctx.fill();
             ctx.stroke();

             // Top lock cap
             ctx.fillStyle = outlineColor;
             ctx.fillRect(-bw/2 + 2, -bh/2, bw - 4, 8);

             // Classic finger loop
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.arc(bw/2, -bh/2 + 4, 6, -Math.PI/2, Math.PI/2);
             ctx.stroke();

             // Label Inscription
             ctx.fillStyle = labelColor;
             ctx.font = 'bold 8px Arial';
             ctx.fillText('32oz', -bw/2 + 4, bh/2 - 6);
        }

        ctx.restore();
    };

    const drawObstacles = (ctx: CanvasRenderingContext2D) => {
        const isNm = isNightModeRef.current;
        const outlineColor = isNm ? '#E1E1D7' : '#434338';

        obstaclesRef.current.forEach(obs => {
            ctx.save();
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 2.5;

            switch(obs.type) {
                case 'bookstack': {
                    // bottom book (warm red)
                    ctx.fillStyle = '#D15E5E';
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y + obs.height - 10, obs.width, 10, [2, 2, 0, 0]);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = isNm ? '#1C1C18' : '#FFFFFF';
                    ctx.fillRect(obs.x + 3, obs.y + obs.height - 8, obs.width - 6, 4);

                    // middle book (sage green)
                    ctx.fillStyle = '#7BA67B';
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 4, obs.y + obs.height - 18, obs.width - 8, 8, [2, 2, 0, 0]);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = isNm ? '#1C1C18' : '#FFFFFF';
                    ctx.fillRect(obs.x + 7, obs.y + obs.height - 16, obs.width - 14, 3);

                    // top book (warm ochre)
                    ctx.fillStyle = '#E8B85A';
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 8, obs.y, obs.width - 16, 10, [2, 2, 0, 0]);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = isNm ? '#1C1C18' : '#FFFFFF';
                    ctx.fillRect(obs.x + 11, obs.y + 2, obs.width - 22, 3);
                    break;
                }

                case 'chair': {
                    // Backrest (natural gray support)
                    ctx.fillStyle = isNm ? '#A5A599' : '#8A8A7A';
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 4, obs.y, obs.width - 8, 14, 3);
                    ctx.fill();
                    ctx.stroke();

                    // back pillar
                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width / 2, obs.y + 14);
                    ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height - 6);
                    ctx.stroke();

                    // seat rest
                    ctx.fillStyle = outlineColor;
                    ctx.fillRect(obs.x, obs.y + 14, obs.width, 4);

                    // lower stance
                    ctx.beginPath();
                    ctx.moveTo(obs.x + 2, obs.y + obs.height);
                    ctx.lineTo(obs.x + obs.width - 2, obs.y + obs.height);
                    ctx.stroke();

                    // little caster studs
                    ctx.fillStyle = outlineColor;
                    ctx.beginPath();
                    ctx.arc(obs.x + 4, obs.y + obs.height, 3, 0, Math.PI * 2);
                    ctx.arc(obs.x + obs.width - 4, obs.y + obs.height, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }

                case 'scissors': {
                    ctx.save();
                    ctx.translate(0, obs.y * 2 + obs.height);
                    ctx.scale(1, -1);

                    // cross metal silver blades
                    ctx.fillStyle = isNm ? '#718096' : '#cbd5e1';
                    ctx.beginPath();
                    ctx.moveTo(obs.x, obs.y + 4);
                    ctx.lineTo(obs.x + obs.width - 6, obs.y + obs.height - 6);
                    ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                    ctx.lineTo(obs.x + 6, obs.y + 12);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width, obs.y + 4);
                    ctx.lineTo(obs.x + 6, obs.y + obs.height - 6);
                    ctx.lineTo(obs.x, obs.y + obs.height);
                    ctx.lineTo(obs.x + obs.width - 6, obs.y + 12);
                    ctx.fill();
                    ctx.stroke();

                    // Finger rings
                    ctx.strokeStyle = '#D15E5E';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(obs.x + 6, obs.y + 6, 5, 0, Math.PI * 2);
                    ctx.arc(obs.x + obs.width - 6, obs.y + 6, 5, 0, Math.PI * 2);
                    ctx.stroke();

                    // central core screw
                    ctx.fillStyle = outlineColor;
                    ctx.beginPath();
                    ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2 + 2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                }

                case 'standingpencil': {
                    // Classic Yellow barrel
                    ctx.fillStyle = '#E8B85A';
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y + 10, obs.width, obs.height - 18, 1);
                    ctx.fill();
                    ctx.stroke();

                    // Sharp wood cone at top
                    ctx.fillStyle = isNm ? '#3C3C34' : '#e2e8f0';
                    ctx.beginPath();
                    ctx.moveTo(obs.x, obs.y + 10);
                    ctx.lineTo(obs.x + obs.width / 2, obs.y);
                    ctx.lineTo(obs.x + obs.width, obs.y + 10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // core lead tip
                    ctx.fillStyle = outlineColor;
                    ctx.beginPath();
                    ctx.moveTo(obs.x + 3, obs.y + 4);
                    ctx.lineTo(obs.x + obs.width / 2, obs.y);
                    ctx.lineTo(obs.x + obs.width - 3, obs.y + 4);
                    ctx.closePath();
                    ctx.fill();

                    // Pink eraser bottom
                    ctx.fillStyle = '#D15E5E';
                    ctx.fillRect(obs.x, obs.y + obs.height - 6, obs.width, 6);
                    ctx.strokeRect(obs.x, obs.y + obs.height - 6, obs.width, 6);

                    // silver ferrule collar
                    ctx.fillStyle = isNm ? '#4A5568' : '#cbd5e1';
                    ctx.fillRect(obs.x, obs.y + obs.height - 8, obs.width, 2);
                    break;
                }

                case 'clock': {
                    // White dial
                    ctx.fillStyle = isNm ? '#2C2C24' : '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 - 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // Twin red bells
                    ctx.fillStyle = '#D15E5E';
                    ctx.beginPath();
                    ctx.arc(obs.x + 6, obs.y + 6, 5, -Math.PI / 4, (5 * Math.PI) / 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(obs.x + obs.width - 6, obs.y + 6, 5, -Math.PI / 4, (5 * Math.PI) / 4);
                    ctx.fill();
                    ctx.stroke();

                    // ticking hour ticks
                    ctx.strokeStyle = isNm ? '#3C3C34' : '#D8D8CF';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2 - 5, 0, Math.PI * 2);
                    ctx.stroke();

                    // Hands details
                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
                    ctx.lineTo(obs.x + obs.width / 2 + 6, obs.y + obs.height / 2 - 4);
                    ctx.moveTo(obs.x + obs.width / 2, obs.y + obs.height / 2);
                    ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height / 2 - 7);
                    ctx.stroke();
                    break;
                }

                case 'table': {
                    // Wood desk surface board
                    ctx.fillStyle = isNm ? '#A5A599' : '#8A8A7A';
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y, obs.width, 8, 2);
                    ctx.fill();
                    ctx.stroke();

                    // desk legs
                    ctx.beginPath();
                    ctx.moveTo(obs.x + 10, obs.y + 8);
                    ctx.lineTo(obs.x + 10, obs.y + obs.height);
                    ctx.moveTo(obs.x + obs.width - 10, obs.y + 8);
                    ctx.lineTo(obs.x + obs.width - 10, obs.y + obs.height);
                    ctx.stroke();

                    // Under-drawer detail (center aligned)
                    ctx.fillStyle = isNm ? '#1C1C18' : '#F5F5F0';
                    const drawerW = 24;
                    const drawerH = 10;
                    const drawerX = obs.x + obs.width / 2 - drawerW / 2;
                    ctx.fillRect(drawerX, obs.y + 8, drawerW, drawerH);
                    ctx.strokeRect(drawerX, obs.y + 8, drawerW, drawerH);
                    
                    // Center drawer handle
                    ctx.fillStyle = outlineColor;
                    ctx.fillRect(drawerX + drawerW / 2 - 3, obs.y + 12, 6, 2);
                    break;
                }

                case 'crayons': {
                    // Fully relative tip vs body sizes
                    const tipHeight = Math.round(obs.height * 0.33);
                    
                    // Box casing
                    ctx.fillStyle = '#E8B85A';
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y + tipHeight, obs.width, obs.height - tipHeight, 2);
                    ctx.fill();
                    ctx.stroke();

                    // green banner badge
                    ctx.fillStyle = '#7BA67B';
                    const badgeH = Math.round((obs.height - tipHeight) * 0.35);
                    const badgeY = obs.y + tipHeight + Math.round((obs.height - tipHeight) * 0.2);
                    ctx.fillRect(obs.x + 4, badgeY, obs.width - 8, badgeH);
                    ctx.strokeRect(obs.x + 4, badgeY, obs.width - 8, badgeH);

                    // Aligned Wax Tip lines (multi-colored, 6 crayons)
                    const numCrayons = 6;
                    const crayonW = (obs.width - 8) / numCrayons;
                    const palette = ['#D15E5E', '#7BA67B', '#E8B85A', '#cbd5e1', outlineColor, '#8A8A7A'];
                    for (let j = 0; j < numCrayons; j++) {
                        const cx = obs.x + 4 + j * crayonW;
                        ctx.fillStyle = palette[j % palette.length];
                        ctx.beginPath();
                        ctx.moveTo(cx + 1, obs.y + tipHeight);
                        ctx.lineTo(cx + crayonW / 2, obs.y);
                        ctx.lineTo(cx + crayonW - 1, obs.y + tipHeight);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                    break;
                }

                case 'backpack': {
                    // Top handle loop
                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    // arc centered horizontally at top of bag
                    ctx.arc(obs.x + obs.width / 2, obs.y + 7, 6, Math.PI, 0);
                    ctx.stroke();

                    // Main backpack shell body
                    ctx.fillStyle = '#4D759E'; // matches classic retro blue
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 3, obs.y + 7, obs.width - 6, obs.height - 7, [10, 10, 4, 4]);
                    ctx.fill();
                    ctx.stroke();

                    // Two vertical retro contrast shoulder straps/accent lines down the center
                    ctx.fillStyle = outlineColor;
                    ctx.fillRect(obs.x + 11, obs.y + 7, 4, obs.height / 2);
                    ctx.fillRect(obs.x + obs.width - 15, obs.y + 7, 4, obs.height / 2);

                    // Front lower zipper pouch
                    ctx.fillStyle = '#E8B85A'; // warm yellow accent
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 8, obs.y + Math.round(obs.height * 0.45) + 3, obs.width - 16, Math.round(obs.height * 0.55) - 6, [4, 4, 4, 4]);
                    ctx.fill();
                    ctx.stroke();

                    // Tiny metal zipper pull tab on the pocket
                    ctx.fillStyle = outlineColor;
                    ctx.fillRect(obs.x + 12, obs.y + Math.round(obs.height * 0.45) + 6, 6, 2);
                    ctx.fillStyle = isNm ? '#5A6270' : '#cbd5e1'; // metallic slider
                    ctx.fillRect(obs.x + 16, obs.y + Math.round(obs.height * 0.45) + 5, 4, 4);

                    // Tiny metal buckles on the vertical shoulder straps
                    ctx.fillStyle = isNm ? '#5A6270' : '#cbd5e1';
                    ctx.fillRect(obs.x + 10, obs.y + Math.round(obs.height * 0.45) - 2, 6, 3);
                    ctx.fillRect(obs.x + obs.width - 16, obs.y + Math.round(obs.height * 0.45) - 2, 6, 3);
                    break;
                }

                case 'paperplane': {
                    // Origami folded plane
                    ctx.fillStyle = isNm ? '#2C2C24' : '#FFFFFF';
                    ctx.beginPath();
                    ctx.moveTo(obs.x, obs.y + obs.height / 2);
                    ctx.lineTo(obs.x + obs.width, obs.y);
                    ctx.lineTo(obs.x + obs.width - 12, obs.y + obs.height - 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // internal crease lines
                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width, obs.y);
                    ctx.lineTo(obs.x + obs.width - 16, obs.y + obs.height / 2 + 1);
                    ctx.lineTo(obs.x + obs.width - 12, obs.y + obs.height - 2);
                    ctx.stroke();
                    break;
                }

                case 'rocket': {
                    // Fuselage core body
                    ctx.fillStyle = '#D15E5E';
                    ctx.beginPath();
                    ctx.roundRect(obs.x + 12, obs.y, obs.width - 16, obs.height, [8, 0, 0, 8]);
                    ctx.fill();
                    ctx.stroke();

                    // rear fins
                    ctx.fillStyle = outlineColor;
                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width - 4, obs.y);
                    ctx.lineTo(obs.x + obs.width, obs.y - 4);
                    ctx.lineTo(obs.x + obs.width - 8, obs.y + 4);
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(obs.x + obs.width - 4, obs.y + obs.height);
                    ctx.lineTo(obs.x + obs.width, obs.y + obs.height + 4);
                    ctx.lineTo(obs.x + obs.width - 8, obs.y + obs.height - 4);
                    ctx.fill();
                    ctx.stroke();

                    // tip nosecone
                    ctx.fillStyle = '#E8B85A';
                    ctx.beginPath();
                    ctx.moveTo(obs.x + 12, obs.y);
                    ctx.quadraticCurveTo(obs.x, obs.y + obs.height / 2, obs.x + 12, obs.y + obs.height);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // window window
                    ctx.fillStyle = isNm ? '#1C1C18' : '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(obs.x + obs.width / 2 + 2, obs.y + obs.height / 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    break;
                }
            }
            ctx.restore();
        });
    };

    const drawParticles = (ctx: CanvasRenderingContext2D) => {
        particlesRef.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, 1 - (p.life / p.maxLife));
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1.0;
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBackground(ctx, canvas);
        drawParticles(ctx);
        drawObstacles(ctx);
        drawPlayer(ctx, playerRef.current);
    };

    // Draw initial view
    if (gameState === 'START') {
      drawBackground(ctx, canvas);
      drawPlayer(ctx, playerRef.current);
    }

    reqRef.current = requestAnimationFrame(gameLoop);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(reqRef.current);
    };
  }, [gameState]);

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div 
          ref={containerRef} 
          className={`relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border shadow-xl cursor-pointer font-sans select-none touch-none transition-all duration-800 ease-in-out ${isNightMode ? 'bg-[#1C1C18] border-[#3C3C34]' : 'bg-[#F5F5F0] border-[#D8D8CF]'}`}
      >
        {/* Terminal UI Score Overlay */}
        <div className="absolute top-4 right-8 flex gap-8 font-mono z-10 pointer-events-none">
          <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase opacity-50 text-[#8A8A7A]">Hi-Score</span>
              <span className={`text-xl font-bold transition-colors duration-800 ${isNightMode ? 'text-[#E1E1D7]' : 'text-[#434338]'}`}>{highScore.toString().padStart(5, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase opacity-50 text-[#8A8A7A]">Current</span>
              <span className={`text-xl font-bold transition-colors duration-800 ${isNightMode ? 'text-[#DCE4CE]' : 'text-[#5A5A40]'}`}>{score.toString().padStart(5, '0')}</span>
          </div>
        </div>

        <canvas 
          ref={canvasRef} 
          className="block w-full touch-none"
          style={{ imageRendering: 'pixelated', height: '300px' }}
        />

        {/* Start Overlay */}
        {gameState === 'START' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[1px] z-20">
            <div className="text-center max-w-sm flex flex-col items-center px-4">
              <h1 className={`text-4xl font-black mb-1 tracking-wider uppercase italic drop-shadow-sm transition-colors duration-800 ${isNightMode ? 'text-[#E1E1D7]' : 'text-[#434338]'}`}>Aquaflip</h1>
              <p className="text-[10.5px] text-[#8A8A7A] mb-6 font-mono tracking-widest uppercase">Desk Run Protocol</p>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className={`py-3 px-8 rounded-xl font-bold transition-all active:scale-95 text-xs uppercase tracking-widest shadow border duration-800 ${isNightMode ? 'bg-[#E1E1D7] text-[#1C1C18] border-[#E1E1D7] hover:bg-white' : 'bg-[#434338] text-white border-[#434338] hover:bg-black'}`}
              >
                <span className="xl:hidden">Tap to Play</span>
                <span className="hidden xl:inline">Start Game</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#D15E5E]/5 backdrop-blur-[1px] z-20">
               <div className="text-center max-w-xs w-full px-4 flex flex-col items-center">
                   <h2 className="text-5xl font-black text-[#D15E5E] mb-1 tracking-widest italic font-sans drop-shadow-sm">Spilled!</h2>
                   <p className="font-mono font-bold mb-6 text-[#8A8A7A] uppercase tracking-widest text-xs">Score: {score.toString().padStart(5, '0')}</p>
                   <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          startGame();
                      }}
                      className="py-3 px-8 bg-[#D15E5E] text-white rounded-xl font-bold hover:bg-[#b04545] transition-all active:scale-95 text-xs uppercase tracking-widest shadow"
                  >
                      Try Again
                   </button>
               </div>
          </div>
        )}
      </div>

      {/* Desktop View Control Guide */}
      <div className={`hidden xl:flex mt-6 w-full max-w-xs flex-col gap-2 font-mono text-[10px] transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#A5A599]' : 'text-[#5A5A40]'}`}>
        <div className={`flex justify-between border-b pb-1 transition-colors duration-800 ease-in-out ${isNightMode ? 'border-[#3C3C34]' : 'border-[#D8D8CF]'}`}>
          <span className="font-bold">SPACE / UP</span>
          <span className={`transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>JUMP</span>
        </div>
        <div className={`flex justify-between border-b pb-1 transition-colors duration-800 ease-in-out ${isNightMode ? 'border-[#3C3C34]' : 'border-[#D8D8CF]'}`}>
          <span className="font-bold">DOWN</span>
          <span className={`transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>SLIDE</span>
        </div>
      </div>
      <p className="hidden xl:block mt-4 font-mono text-[10px] text-[#8A8A7A]">
        Hold to jump higher or slide longer.
      </p>

      <p className="xl:hidden mt-4 px-2 font-mono text-[10px] text-[#8A8A7A] text-center">
        Hold to jump higher.
      </p>
    </div>
  );
}
