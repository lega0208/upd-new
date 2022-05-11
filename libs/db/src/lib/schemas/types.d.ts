export declare type AccumulatorOperator = '$accumulator' | '$addToSet' | '$avg' | '$count' | '$first' | '$last' | '$max' | '$mergeObjects' | '$min' | '$push' | '$stdDevPop' | '$stdDevSamp' | '$sum';
export interface GscSearchTermMetrics {
    term: string;
    clicks: number;
    ctr: number;
    impressions: number;
    position: number;
}
