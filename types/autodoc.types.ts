export interface StepConfig {
  title: string;
  description?: string | null;
  action?: (() => Promise<void>) | null;
  screenshot?: boolean;
  showNumber?: boolean;
  skipNumber?: boolean;
}

export interface ScreenshotConfig {
  title: string;
  description?: string | null;
  elementOnly?: boolean | string | null;
  padding?: number;
  showNumber?: boolean;
  skipNumber?: boolean;
}

export interface HighlightOptions {
  elementOnly?: boolean | string | null;
  padding?: number;
  title?: string;
  showNumber?: boolean;
  skipNumber?: boolean;
}

export interface ClickConfig {
  selector: string;
  title: string;
  description?: string | null;
  elementOnly?: boolean | string | null;
  padding?: number;
  showNumber?: boolean;
  skipNumber?: boolean;
}

export interface FillConfig {
  selector: string;
  value: string;
  title: string;
  description?: string | null;
  elementOnly?: boolean | string | null;
  padding?: number;
  showNumber?: boolean;
  skipNumber?: boolean;
}

export interface RelatedTopic {
  title: string;
  url: string;
}

export interface AutodocOptions {
  title?: string;
  overview?: string;
  prerequisites?: string[];
  notes?: string[];
  relatedTopics?: (string | RelatedTopic)[];
  showNumbers?: boolean;
}

export interface Step {
  stepNumber: number;
  numberedStepNumber: number | null;
  title: string;
  description: string | null;
  screenshot: string | null;
  note: string | null;
  showNumber: boolean;
}