export class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v: Vector): this {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: Vector): this {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n: number): this {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n: number): this {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag(): number {
        return Math.hypot(this.x, this.y);
    }

    normalize(): this {
        const m = this.mag();
        if (m !== 0) {
            this.div(m);
        }
        return this;
    }

    limit(max: number): this {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }

    dist(v: Vector): number {
        return Math.hypot(this.x - v.x, this.y - v.y);
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    static sub(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static fromAngle(angle: number, mag: number = 1): Vector {
        return new Vector(Math.cos(angle) * mag, Math.sin(angle) * mag);
    }

    static random(mag: number = 1): Vector {
        const angle = Math.random() * Math.PI * 2;
        return Vector.fromAngle(angle, mag);
    }
}
