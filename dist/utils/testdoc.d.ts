import { Page } from '@playwright/test';
import type { StepConfig, ScreenshotConfig, HighlightOptions, ClickConfig, FillConfig, TestdocOptions, Step } from '../types/testdoc.types';
export declare class TestdocTest {
    private page;
    private title;
    steps: Step[];
    private screenshotDir;
    private stepCounter;
    private numberedStepCounter;
    private overview;
    private prerequisites;
    private notes;
    private relatedTopics;
    private defaultShowNumbers;
    constructor(page: Page, testName: string, options?: TestdocOptions);
    initialize(): Promise<void>;
    createSlug(text: string): string;
    step(config: StepConfig | string, description?: string | null, action?: (() => Promise<void>) | null, options?: Partial<StepConfig>): Promise<void>;
    note(note: string): Promise<void>;
    screenshot(config: ScreenshotConfig | string, description?: string | null, options?: Partial<ScreenshotConfig>): Promise<void>;
    highlight(selector: string, action?: (() => Promise<void>) | null, options?: HighlightOptions): Promise<{
        stepNumber: number;
        numberedStepNumber: number | null;
        screenshot: string;
    }>;
    click(config: ClickConfig | string, title?: string, description?: string | null, options?: Partial<ClickConfig>): Promise<void>;
    fill(config: FillConfig | string, value?: string, title?: string, description?: string | null, options?: Partial<FillConfig>): Promise<void>;
    generateMarkdown(): Promise<string>;
    generateRST(): Promise<string>;
    downloadFromHref(selector: string, downloadPath?: string): Promise<string>;
    uploadFile(selector: string, filePath: string, title?: string, description?: string): Promise<void>;
    uploadFileParagon(selector: string, filePath: string): Promise<void>;
    hideElement(selector: string): Promise<void>;
    ShowElement(selector: string, display: string): Promise<void>;
}
//# sourceMappingURL=testdoc.d.ts.map