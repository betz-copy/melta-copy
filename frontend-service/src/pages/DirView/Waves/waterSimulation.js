// original code taken from https://codepen.io/iiSeptum/pen/qBZeLg

/**
 * @returns {{init: (canvas: HTMLCanvasElement) => void, stop: () => void}}
 * @example
 * const water = waterSimulation();
 * water.init(canvasRef.current);
 * water.stop();
 * water.destroy();
 * @see https://codepen.io/iiSeptum/pen/qBZeLg
 */
export const waterSimulation = () => {
    const MOUSE_INFLUENCE = 7;
    const GRAVITY_X = 0;
    const GRAVITY_Y = 0.5;
    const MOUSE_REPEL = false;
    const GROUPS = [2000];
    const GROUP_COLORS = ['rgba(97,160,232'];

    let ctx;
    let width;
    let height;
    let numX;
    let numY;
    let particles;
    let grid;
    let play = false;
    const spacing = 45;
    const radius = 30;
    const limit = radius * 0.66;
    let textures;
    let animationFrame;

    const mouse = { down: false, x: 0, y: 0 };

    const run = () => {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0, l = numX * numY; i < l; i++) grid[i].length = 0;

        let i = particles.length;
        while (i--) particles[i].firstProcess();
        i = particles.length;
        while (i--) particles[i].secondProcess();

        if (mouse.down) {
            ctx.canvas.style.cursor = 'none';

            ctx.fillStyle = 'rgba(97, 160, 232, 0.05)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, radius * MOUSE_INFLUENCE, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(97, 160, 232, 0.05)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, (radius * MOUSE_INFLUENCE) / 3, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        } else ctx.canvas.style.cursor = 'default';

        if (play) {
            animationFrame = requestAnimationFrame(run);
        }
    };

    class Particle {
        constructor(type, x, y) {
            this.type = type;
            this.x = x;
            this.y = y;
            this.px = x;
            this.py = y;
            this.vx = 0;
            this.vy = 0;
        }

        firstProcess() {
            const g = grid[Math.round(this.y / spacing) * numX + Math.round(this.x / spacing)];

            if (g) g.close[g.length++] = this;

            this.vx = this.x - this.px;
            this.vy = this.y - this.py;

            if (mouse.down) {
                const distX = this.x - mouse.x;
                const distY = this.y - mouse.y;
                const dist = Math.sqrt(distX * distX + distY * distY);
                if (dist < radius * MOUSE_INFLUENCE) {
                    const cos = distX / dist;
                    const sin = distY / dist;
                    this.vx += MOUSE_REPEL ? cos : -cos;
                    this.vy += MOUSE_REPEL ? sin : -sin;
                }
            }

            this.vx += GRAVITY_X;
            this.vy += GRAVITY_Y;
            this.px = this.x;
            this.py = this.y;
            this.x += this.vx;
            this.y += this.vy;
        }

        secondProcess() {
            let force = 0;
            let forceB = 0;
            const cellX = Math.round(this.x / spacing);
            const cellY = Math.round(this.y / spacing);
            const close = [];

            for (let xOff = -1; xOff < 2; xOff++) {
                for (let yOff = -1; yOff < 2; yOff++) {
                    const cell = grid[(cellY + yOff) * numX + (cellX + xOff)];
                    if (cell?.length) {
                        for (let a = 0, l = cell.length; a < l; a++) {
                            const particle = cell.close[a];
                            if (particle !== this) {
                                const dfx = particle.x - this.x;
                                const dfy = particle.y - this.y;
                                const distance = Math.sqrt(dfx * dfx + dfy * dfy);
                                if (distance < spacing) {
                                    const m = 1 - distance / spacing;
                                    force += m ** 2;
                                    forceB += m ** 3 / 2;
                                    particle.m = m;
                                    particle.dfx = (dfx / distance) * m;
                                    particle.dfy = (dfy / distance) * m;
                                    close.push(particle);
                                }
                            }
                        }
                    }
                }
            }

            force = (force - 10) * 0.5;

            for (let i = 0, l = close.length; i < l; i++) {
                const neighbor = close[i];

                let press = force + forceB * neighbor.m;
                if (this.type !== neighbor.type) press *= 0.35;

                const dx = neighbor.dfx * press * 0.5;
                const dy = neighbor.dfy * press * 0.5;

                neighbor.x += dx;
                neighbor.y += dy;
                this.x -= dx;
                this.y -= dy;
            }

            if (this.x < limit) this.x = limit;
            else if (this.x > width - limit) this.x = width - limit;

            if (this.y < limit) this.y = limit;
            else if (this.y > height - limit) this.y = height - limit;

            this.draw();
        }

        draw() {
            const size = radius * 2;

            ctx.drawImage(textures[this.type], this.x - radius, this.y - radius, size, size);
        }
    }

    return {
        init: (canvas) => {
            particles = [];
            grid = [];
            textures = [];

            ctx = canvas.getContext('2d');
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            width = canvas.width;
            height = canvas.height;

            for (let i = 0; i < GROUPS.length; i++) {
                const color = GROUP_COLORS[i] ?? `hsla(${Math.round(Math.random() * 360)}, 80%, 60%`;

                textures[i] = document.createElement('canvas');
                textures[i].width = radius * 2;
                textures[i].height = radius * 2;
                const nctx = textures[i].getContext('2d');

                const grad = nctx.createRadialGradient(radius, radius, 1, radius, radius, radius);

                grad.addColorStop(0, `${color},1)`);
                grad.addColorStop(1, `${color},0.3)`);
                nctx.fillStyle = grad;
                nctx.beginPath();
                nctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
                nctx.closePath();
                nctx.fill();
            }

            canvas.onmousedown = (e) => {
                if (e.button !== 0) return true;
                mouse.down = true;
                return false;
            };

            canvas.onmouseup = () => {
                mouse.down = false;
                return false;
            };

            canvas.onmousemove = (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
                return false;
            };

            numX = Math.round(width / spacing) + 1;
            numY = Math.round(height / spacing) + 1;

            for (let i = 0; i < numX * numY; i++) {
                grid[i] = { length: 0, close: [] };
            }

            for (let i = 0; i < GROUPS.length; i++) {
                for (let j = 0; j < GROUPS[i]; j++) {
                    particles.push(new Particle(i, radius + Math.random() * (width - radius * 2), radius + Math.random() * (height - radius * 2)));
                }
            }

            play = true;
            run();
        },
        stop: () => {
            play = false;
        },
        destroy: () => {
            play = false;
            cancelAnimationFrame(animationFrame);
        },
    };
};
