// ============================================================
// mmdParser.ts
// Parses Mathpix Markdown (.mmd) output into structured MCQs
// MMD format uses: "52. Question text" + "(a) option" + ![](img)
// ============================================================

export interface ParsedOption {
    id: "A" | "B" | "C" | "D";
    answer: string;       // cleaned text/latex
    type: "NORMAL";
}

export interface ParsedQuestion {
    questionNumber: number;
    questionLatex: string;   // math stays as $...$ — ready for your DB
    questionText: string;    // plain text fallback
    hasImage: boolean;
    imageIds: string[];      // Mathpix CDN image IDs
    options: ParsedOption[];
    source?: string;         // e.g. "CBSE 2025"
    type: "MCQ";
    difficulty: "EASY";
    solutionType: "TEXT" | "IMAGE";
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Normalize LaTeX delimiters to use $ and $$ (dollar sign format).
 *
 * Why dollar signs instead of \(...\)?
 * Because \( becomes \\( in JSON, which arrives at the frontend doubled.
 * Dollar signs need no escaping in JSON — $\frac{1}{2}$ stays exactly that.
 *
 * Handles:
 * 1. \\( \\frac \\) — double-escaped from JSON parsing  → $\frac$
 * 2. \( \frac \)   — single backslash MMD format        → $\frac$
 * 3. $\frac$       — already dollar format              → unchanged
 */
function normalizeLatex(str: string): string {
    // The MMD string from Mathpix already has single backslashes (charcode 92).
    // \\( in a JS string literal = ONE backslash + open paren in memory.
    // JSON.stringify handles escaping automatically for the HTTP response.
    // DO NOT transform — just trim and return as-is.
    return str.trim();
}

/** Extract all ![](url) image URLs from a block */
function extractImageIds(block: string): string[] {
    const regex = /!\[.*?\]\(([^)]+)\)/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(block)) !== null) {
        ids.push(match[1].trim());
    }
    return ids;
}

/** Strip figure captions like "Fig. 3.19", "Fig.3.20" etc */
function removeFigCaptions(text: string): string {
    return text.replace(/Fig\.?\s*[\d.]+\s*/gi, "").trim();
}

/** Extract [CBSE 2025] style tags */
function extractSource(block: string): string | undefined {
    const match = block.match(/\[([A-Z]+\s*\d{4}[^\]]*)\]/i);
    return match ? match[1].trim() : undefined;
}

/** Clean option text — remove leading (a)/(b)/(c)/(d) */
function cleanOptionText(raw: string): string {
    return raw
        .replace(/^\([abcd]\)\s*/i, "")
        .replace(/\[CBSE.*?\]/gi, "")
        .trim();
}

// ── Main Parser ───────────────────────────────────────────────

export function parseMmdToQuestions(mmdContent: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];

    // ── Step 1: Split on question numbers (e.g. "52.", "59.", "60.")
    // Pattern: start of line, digits, dot, space
    const questionSplitRegex = /(?=^\d+\.\s)/m;
    const blocks = mmdContent.split(questionSplitRegex).map(b => b.trim()).filter(Boolean);

    for (const block of blocks) {
        // ── Step 2: Extract question number
        const numMatch = block.match(/^(\d+)\.\s+/);
        if (!numMatch) continue;
        const questionNumber = parseInt(numMatch[1]);

        // ── Step 3: Must have options (a) to be a valid MCQ
        if (!/\(a\)/i.test(block)) continue;

        // ── Step 4: Split question text vs options
        // Everything before first (a) is the question
        const firstOptionIdx = block.search(/^\(a\)/im);
        if (firstOptionIdx === -1) continue;

        const questionRaw = block
            .substring(0, firstOptionIdx)
            .replace(/^\d+\.\s+/, "")   // remove "52. " prefix
            .trim();

        const optionsRaw = block.substring(firstOptionIdx).trim();

        // ── Step 5: Clean question text
        // Remove image markdown and fig captions, then normalize latex
        const questionLatex = normalizeLatex(
            removeFigCaptions(
                questionRaw
                    .replace(/!\[.*?\]\([^)]+\)/g, "")   // remove ![](url)
                    .replace(/\[CBSE.*?\]/gi, "")
                    .replace(/\s{2,}/g, " ")
                    .trim()
            )
        );

        // Plain text: strip all math delimiters
        const questionText = questionLatex
            .replace(/\\\(|\\\)/g, "")
            .replace(/\\\[|\\\]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

        // ── Step 6: Extract images from full block
        const imageIds = extractImageIds(block);
        const hasImage = imageIds.length > 0;

        // ── Step 7: Parse options A B C D
        // Split on (a) (b) (c) (d) boundaries
        const optionLines = optionsRaw.split(/(?=^\([abcd]\))/im);
        const optionMap: Record<string, string> = {};

        for (const line of optionLines) {
            const optMatch = line.match(/^\(([abcd])\)\s*([\s\S]*)/i);
            if (optMatch) {
                const letter = optMatch[1].toLowerCase();
                const text = normalizeLatex(
                    cleanOptionText(line).replace(/\s{2,}/g, " ").trim()
                );
                optionMap[letter] = text;
            }
        }

        const idMap: Record<string, "A" | "B" | "C" | "D"> = {
            a: "A", b: "B", c: "C", d: "D",
        };

        const options: ParsedOption[] = Object.entries(optionMap)
            .filter(([k]) => ["a", "b", "c", "d"].includes(k))
            .map(([k, v]) => ({
                id: idMap[k],
                answer: v,
                type: "NORMAL" as const,
            }))
            .sort((x, y) => x.id.localeCompare(y.id));

        if (options.length < 2) continue;

        // ── Step 8: Extract source tag
        const source = extractSource(block);

        questions.push({
            questionNumber,
            questionLatex,
            questionText,
            hasImage,
            imageIds,
            options,
            source,
            type: "MCQ",
            difficulty: "EASY",
            solutionType: hasImage ? "IMAGE" : "TEXT",
        });
    }

    return questions;
}

// ── Convert to your MongoDB schema ───────────────────────────

export function toDbFormat(
    q: ParsedQuestion,
) {


    return {
        type: "MCQ" as const,
        difficulty: q.difficulty,
        solutionType: q.solutionType,
        solution: null,
        question: {
            text: q.questionText,
            latex: q.questionLatex,
        },
        options: q.options.map(opt => ({
            id: opt.id,
            answer: opt.answer,
            type: opt.type,
        })),
        correctAnswer: "",    // admin fills in review screen
        isActive: true,
        isDeleted: false,
    };
}