export interface Point {
    x_norm: number;
    y_norm: number;
    px_x: number;
    px_y: number;
    cluster: number;
}

export interface Centroid {
    x_norm: number;
    y_norm: number;
}

export class MLUnsupervisedEngine {
    centroids: Centroid[] = [];
    k: number;

    constructor(k: number = 3) {
        this.k = k;
    }

    initCentroids(points: Point[]) {
        this.centroids = [];
        if (points.length === 0) return;
        
        // Randomly pick k points
        const shuffled = [...points].sort(() => 0.5 - Math.random());
        for (let i = 0; i < this.k && i < shuffled.length; i++) {
            this.centroids.push({ x_norm: shuffled[i].x_norm, y_norm: shuffled[i].y_norm });
        }
    }

    assignClusters(points: Point[]): boolean {
        if (this.centroids.length === 0) return false;
        let changed = false;

        for (const p of points) {
            let minDist = Infinity;
            let bestCluster = -1;

            for (let i = 0; i < this.centroids.length; i++) {
                const c = this.centroids[i];
                const dist = Math.hypot(p.x_norm - c.x_norm, p.y_norm - c.y_norm);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = i;
                }
            }

            if (p.cluster !== bestCluster) {
                p.cluster = bestCluster;
                changed = true;
            }
        }
        return changed;
    }

    updateCentroids(points: Point[]) {
        for (let i = 0; i < this.centroids.length; i++) {
            const clusterPoints = points.filter(p => p.cluster === i);
            if (clusterPoints.length === 0) continue;

            const sumX = clusterPoints.reduce((sum, p) => sum + p.x_norm, 0);
            const sumY = clusterPoints.reduce((sum, p) => sum + p.y_norm, 0);
            
            this.centroids[i].x_norm = sumX / clusterPoints.length;
            this.centroids[i].y_norm = sumY / clusterPoints.length;
        }
    }
}
