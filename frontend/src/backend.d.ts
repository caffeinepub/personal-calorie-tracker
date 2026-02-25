import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Result = {
    __kind__: "failure";
    failure: string;
} | {
    __kind__: "success";
    success: null;
};
export interface FoodEntry {
    id: string;
    date: string;
    calories: bigint;
    image: ExternalBlob;
    foodName: string;
}
export interface StepRecord {
    date: string;
    steps: bigint;
}
export interface DailySummary {
    totalCaloriesBurned: bigint;
    totalSteps: bigint;
    totalCaloriesConsumed: bigint;
    netCalories: bigint;
}
export interface backendInterface {
    addFoodEntry(id: string, date: string, foodName: string, calories: bigint, image: ExternalBlob): Promise<void>;
    deleteFoodEntry(id: string, date: string): Promise<Result>;
    getAllStepRecords(): Promise<Array<StepRecord>>;
    getAvailableDates(): Promise<Array<string>>;
    getCalorieLimit(date: string): Promise<bigint>;
    getDailySummary(date: string): Promise<DailySummary>;
    getEntriesForDate(date: string): Promise<Array<FoodEntry>>;
    getEntriesForDateSortedByFood(date: string): Promise<Array<FoodEntry>>;
    getSteps(date: string): Promise<bigint>;
    logSteps(date: string, steps: bigint): Promise<void>;
    setCalorieLimit(date: string, limit: bigint): Promise<void>;
}
