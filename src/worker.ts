// worker.ts

import { type PipelineType, pipeline } from "@xenova/transformers";

// Extend the global scope for a dedicated worker
declare const self: DedicatedWorkerGlobalScope & typeof globalThis;

/**
 * This class uses the Singleton pattern to ensure that only one instance of the
 * pipeline is loaded. This is because loading the pipeline is an expensive
 * operation and we don't want to do it every time we want to translate a sentence.
 */
class MyTranslationPipeline {
	static task = "translation";
	static model = "Xenova/nllb-200-distilled-600M";
	static instance: any = null;

	static async getInstance(
		progressCallback: ((x: any) => void) | undefined = undefined,
	): Promise<any> {
		if (MyTranslationPipeline.instance === null) {
			MyTranslationPipeline.instance = pipeline(
				MyTranslationPipeline.task as PipelineType,
				MyTranslationPipeline.model,
				{ quantized: true, progress_callback: progressCallback },
			);
		}
		return MyTranslationPipeline.instance;
	}
}

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent) => {
	// Retrieve the translation pipeline. When called for the first time,
	// this will load the pipeline and save it for future use.
	const translator = await MyTranslationPipeline.getInstance((x) => {
		// We also add a progress callback to the pipeline so that we can
		// track model loading.
		self.postMessage(x);
	});

	// Log the language codes
	console.log(event.data.tgt_lang, event.data.src_lang, "langcode");

	// Actually perform the translation
	const output = await translator?.(event.data.text, {
		tgt_lang: event.data.tgt_lang,
		src_lang: event.data.src_lang,
		// Allows for partial output
		callback_function: (x: any) => {
			self.postMessage({
				status: "update",
				output: translator.tokenizer.decode(x[0].output_token_ids, {
					skip_special_tokens: true,
				}),
			});
		},
	});

	// Send the output back to the main thread
	self.postMessage({
		status: "complete",
		output: output,
	});
});
