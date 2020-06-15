// Measure performance and what's making it slow
import { BureauOfStatistics, StatisticsReport } from "./simutil";

export class PerfStat {

    startTime: number;
    prevTime: number;
    static isLocal: boolean = document.documentURI.startsWith("file");

    measure_start() {
        this.startTime = new Date().getTime();
        this.prevTime = this.startTime;
    }

    measure_block(name: string) {
        let currTime = new Date().getTime();
        let elapsed = currTime - this.prevTime;
        this.prevTime = currTime;
        if (PerfStat.isLocal) {
            console.log(`block ${name} took ${elapsed} ms`);
        }
    }

    measure_end(name: string, simulation) {
        this.measure_block(name);
        let elapsed = this.prevTime - this.startTime;
        let stats: StatisticsReport = BureauOfStatistics.generate_statistic_report(Object.values(simulation.people));
        if (PerfStat.isLocal) {
            console.log(`Simulation update took ${elapsed} ms; There are ${stats.population} people`)
        }
    }
}
