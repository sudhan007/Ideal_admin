// ============================================================
// bulkUploadPipeline.ts  (updated for MMD)
// ============================================================

import { getCollection } from "@lib/config/db.config";
import { parseMmdToQuestions, toDbFormat } from "./latexparser";
import { MATHPIX_PDF_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";

// ── Step 1: Poll until ready ──────────────────────────────────

const PDF_COLLECTION = "pdfResults";

export async function pollMathpixUntilReady(
    pdfId: string,
    lessonId?: string | null,
    examId?: string | null,
    maxAttempts = 30,
    intervalMs = 3000
): Promise<void> {
    const pdfCollection = await getCollection(MATHPIX_PDF_COLLECTION);

    for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}`, {
            headers: {
                app_id: process.env.MATHPIX_APP_ID!,
                app_key: process.env.MATHPIX_APP_KEY!,
            },
        });

        const data = await res.json();

        console.log(
            `Poll ${i + 1}: status=${data.status} ${data.percent_done ?? 0}%`
        );

        // ❌ Error case
        if (data.status === "error") {
            throw new Error("Mathpix processing failed");
        }

        // ✅ Completed → SAVE ONLY ONCE
        if (data.status === "completed") {
            const result = await pdfCollection.updateOne(
                { pdf_id: pdfId },
                {
                    $setOnInsert: {
                        pdf_id: pdfId,
                        status: data.status,
                        lessonId: lessonId ? new ObjectId(lessonId) : null,
                        examId: examId ? new ObjectId(examId) : null,
                        fileName: data.input_file,
                        numPages: data.num_pages,
                        numPagesCompleted: data.num_pages_completed,
                        percentDone: data.percent_done,
                        createdAt: new Date(),
                    },
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                console.log("✅ Saved PDF result:", pdfId);
            } else {
                console.log("⚡ Already saved:", pdfId);
            }

            return;
        }

        // ⏳ Wait before next poll
        await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error("Mathpix polling timed out");
}

// ── Step 2: Download .mmd (always available, no conversion needed)
export async function downloadMmd(pdfId: string): Promise<string> {
    const res = await fetch(`https://api.mathpix.com/v3/pdf/${pdfId}.mmd`, {
        headers: {
            app_id: process.env.MATHPIX_APP_ID!,
            app_key: process.env.MATHPIX_APP_KEY!,
        },
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to download MMD: ${err}`);
    }

    const text = await res.text();
    console.log(`📄 MMD downloaded: ${text.length} chars`);

    // DEBUG: log first 500 chars so you can verify format
    console.log("--- MMD PREVIEW ---\n", text.substring(0, 500), "\n---");

    return text;
}


// ── Step 3: Full pipeline ─────────────────────────────────────
export async function runBulkUploadPipeline(pdfId: string, lessonId?: string | null, examId?: string | null) {
    console.log("⏳ Polling Mathpix...");
    await pollMathpixUntilReady(pdfId, lessonId, examId);

    console.log("📥 Downloading MMD...");
    const mmdContent = await downloadMmd(pdfId);

    console.log("🔍 Parsing questions...");
    const questions = parseMmdToQuestions(mmdContent);
    console.log(`✅ Found ${questions.length} questions`);

    if (questions.length === 0) {
        // Extra debug: show raw content structure
        console.log("⚠️  Parser found 0 questions. Raw MMD sample:");
        console.log(mmdContent.substring(0, 1000));
        return [];
    }

    // Convert to DB format (correctAnswer left empty for admin review)
    return questions.map(q => toDbFormat(q));
}