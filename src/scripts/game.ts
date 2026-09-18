export class Game {
    public cellGrid: boolean[][] = Array.from({ length: 100 }, () => Array(100).fill(false));
    constructor() {
        this.cellGrid = Array.from({ length: 100 }, () => Array(100).fill(false));
    };

    updateCellState(x: number, y: number) {
        this.cellGrid[x]![y] = !this.cellGrid[x]![y];
    }

    nextGeneration() {
        const nextCellGrid: boolean[][] = Array.from({ length: 100 }, () => Array(100).fill(false));
        for (const iX of this.cellGrid.keys()) {
            if (!this.cellGrid[iX]) return;
            for (const iY of this.cellGrid[iX].keys()) {
                if (!nextCellGrid[iX]) return;
                nextCellGrid[iX][iY] = this.processNewState(iX, iY);
            }
        }

        this.cellGrid = nextCellGrid;
    }

    processNewState(iX: number, iY: number): boolean {
        const aliveNeighbors = this.countNeighbors(iX, iY);
        const isCellAlive = this.cellGrid[iX]![iY];

        if (isCellAlive) {
            if (aliveNeighbors === 2) return true;
            return false;
        }

        return aliveNeighbors === 3;
    }

    countNeighbors(iX: number, iY: number): number {
        let aliveNeighbors = 0;
        for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
                if (x === 0 && y === 0) continue;
                if ((iX + x) < 0 || (iY + y) < 0) continue;
                if ((iX + x) >= 100 || (iY + y) >= 100) continue;
                if (this.cellGrid[iX + x]![iY + y]) {
                    aliveNeighbors++;
                }
            }
        }

        return aliveNeighbors;
    }
}
