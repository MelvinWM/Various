#!/bin/sh

echo "Note: There may be non-important errors when compiling."
echo ""

echo "Compiling overall application."
tsc -module System --strict main_typescript_javascript.ts webworker_messages.ts circlefractal_image_drawing.ts
echo "Compilation done."

echo "Compiling web worker."
tsc --outFile webworker_file.js -module System --strict webworker_image_drawing.ts webworker_messages.ts circlefractal_image_drawing.ts
echo "Compilation done."

