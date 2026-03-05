"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftDate = exports.formatDate = exports.highlightAndScreenshot = exports.captureHighlightedScreenshot = exports.removeHighlight = exports.highlightElement = exports.addHighlightStyles = exports.assertVisualRegression = exports.VisualRegression = exports.assertA11y = exports.checkA11y = exports.MarkdownTestParser = exports.TestdocTest = void 0;
// Main exports
var testdoc_1 = require("./testdoc");
Object.defineProperty(exports, "TestdocTest", { enumerable: true, get: function () { return testdoc_1.TestdocTest; } });
var markdown_test_parser_1 = require("./markdown-test-parser");
Object.defineProperty(exports, "MarkdownTestParser", { enumerable: true, get: function () { return markdown_test_parser_1.MarkdownTestParser; } });
// A11y helpers
var a11y_helpers_1 = require("./a11y-helpers");
Object.defineProperty(exports, "checkA11y", { enumerable: true, get: function () { return a11y_helpers_1.checkA11y; } });
Object.defineProperty(exports, "assertA11y", { enumerable: true, get: function () { return a11y_helpers_1.assertA11y; } });
// Visual regression helpers
var visual_regression_helpers_1 = require("./visual-regression-helpers");
Object.defineProperty(exports, "VisualRegression", { enumerable: true, get: function () { return visual_regression_helpers_1.VisualRegression; } });
Object.defineProperty(exports, "assertVisualRegression", { enumerable: true, get: function () { return visual_regression_helpers_1.assertVisualRegression; } });
// Element highlighter utilities
var element_highlighter_1 = require("./element-highlighter");
Object.defineProperty(exports, "addHighlightStyles", { enumerable: true, get: function () { return element_highlighter_1.addHighlightStyles; } });
Object.defineProperty(exports, "highlightElement", { enumerable: true, get: function () { return element_highlighter_1.highlightElement; } });
Object.defineProperty(exports, "removeHighlight", { enumerable: true, get: function () { return element_highlighter_1.removeHighlight; } });
Object.defineProperty(exports, "captureHighlightedScreenshot", { enumerable: true, get: function () { return element_highlighter_1.captureHighlightedScreenshot; } });
Object.defineProperty(exports, "highlightAndScreenshot", { enumerable: true, get: function () { return element_highlighter_1.highlightAndScreenshot; } });
// Date utilities
var dates_1 = require("./dates");
Object.defineProperty(exports, "formatDate", { enumerable: true, get: function () { return dates_1.formatDate; } });
Object.defineProperty(exports, "shiftDate", { enumerable: true, get: function () { return dates_1.shiftDate; } });
//# sourceMappingURL=index.js.map