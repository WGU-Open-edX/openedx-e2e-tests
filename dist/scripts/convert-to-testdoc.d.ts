#!/usr/bin/env ts-node
/**
 * Script to convert regular Playwright tests to testdoc format
 *
 * Usage: ts-node scripts/convert-to-testdoc.ts <input-file> [output-file]
 *
 * Example: ts-node scripts/convert-to-testdoc.ts tests/test-1.spec.ts tests/test-1.testdoc.spec.ts
 */
interface ConversionOptions {
    title?: string;
    overview?: string;
    prerequisites?: string[];
    notes?: string[];
    relatedTopics?: Array<string | {
        title: string;
        url: string;
    }>;
}
declare class PlaywrightToTestdocConverter {
    private source;
    private testName;
    private options;
    constructor(source: string, options?: ConversionOptions);
    /**
     * Escape quotes in strings
     */
    private escapeQuotes;
    /**
     * Main conversion method
     */
    convert(): string;
    /**
     * Add necessary imports for testdoc
     */
    private addImports;
    /**
     * Generate the test structure with testdoc
     */
    private generateTestStructure;
    /**
     * Generate testdoc initialization
     */
    private generateTestdocInit;
    /**
     * Convert test body to testdoc format
     */
    private convertTestBody;
    /**
     * Convert Playwright locator to CSS selector
     * Uses :has-text() for most elements, which works well with Playwright
     */
    private convertLocatorToSelector;
    /**
     * Extract page title from URL
     */
    private getPageTitle;
}
export { PlaywrightToTestdocConverter, ConversionOptions };
//# sourceMappingURL=convert-to-testdoc.d.ts.map