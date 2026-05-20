#!/usr/bin/env ts-node
interface WCAGCriterion {
    num: string;
    level: 'A' | 'AA' | 'AAA';
    title: string;
    conformanceLevel: 'Supports' | 'Partially Supports' | 'Does Not Support' | 'Not Evaluated';
    remarks: string;
    violations: string[];
}
interface PageReport {
    pageName: string;
    url: string;
    violations: number;
    passes: number;
}
interface VPATData {
    productName: string;
    productVersion: string;
    reportDate: string;
    productDescription: string;
    contactInformation: string;
    evaluationMethods: string;
    pagesEvaluated: PageReport[];
    wcagCriteria: WCAGCriterion[];
}
/**
 * Generates VPAT data from accessibility reports
 */
declare function generateVPATData(reportsDir: string, productInfo?: Partial<VPATData>): VPATData;
/**
 * Generates HTML VPAT report
 */
declare function generateHTMLReport(data: VPATData): string;
/**
 * Generates Markdown VPAT report
 */
declare function generateMarkdownReport(data: VPATData): string;
/**
 * Generates RST VPAT report
 */
declare function generateRSTReport(data: VPATData): string;
export { generateVPATData, generateHTMLReport, generateMarkdownReport, generateRSTReport, type VPATData, type WCAGCriterion, };
