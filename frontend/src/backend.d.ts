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
export interface FoodEntry {
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
    addFoodEntry(date: string, foodName: string, calories: bigint, image: ExternalBlob): Promise<void>;
    getAllStepRecords(): Promise<Array<StepRecord>>;
    getAvailableDates(): Promise<Array<string>>;
    getDailySummary(date: string): Promise<DailySummary>;
    getEntriesForDate(date: string): Promise<Array<FoodEntry>>;
    getEntriesForDateSortedByFood(date: string): Promise<Array<FoodEntry>>;
    getSteps(date: string): Promise<bigint>;
}
