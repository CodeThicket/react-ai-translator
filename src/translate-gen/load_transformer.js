const {
	pipeline,
	env,
	AutoModelForSeq2SeqLM,
	AutoTokenizer,
	AutoConfig,
	T5Tokenizer,
	T5Model,
	T5ForConditionalGeneration,
	MT5ForConditionalGeneration,
} = require("@huggingface/transformers");

let translator = null; // Store the promise

const progressCallback = (statusInfo) => {
	console.log(statusInfo);
	const { downloadedBytes, totalBytes, fileName } = statusInfo;
	const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);

	console.log(`Downloading ${fileName || "model"}: ${progress}%`);
};

async function loadModelM2M(modelName) {
	// Varosa/m2m100-onnx
	if (!translator) {
		console.log("Retreiving Model");
		translator = pipeline("translation", modelName, {
			dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
			progressCallback,
		})
			.then((classifier) => {
				console.log(`Model ${modelName} loaded`);
				return classifier;
			})
			.catch((err) => {
				console.error("Error loading model:", err);
				translator = null;
				throw err;
			});
	}
	return translator;
}

async function loadAutoModelT5() {
	// Xenova/t5-small
	if (!translator) {
		const hfToken = "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";
		process.env.HF_TOKEN = hfToken;
		const tokeniser = await AutoTokenizer.from_pretrained("Xenova/t5-small", {
			progressCallback,
		});
		const model =
			await AutoModelForSeq2SeqLM.from_pretrained("Xenova/t5-small");
		translator = Promise.resolve()
			.then((_classifier) => {
				console.log("Model loaded");
				// console.log(tokeniser,model)
				return [tokeniser, model];
			})
			.catch((err) => {
				console.error("Error loading model:", err);
				translator = null;
				throw err;
			});
	}
	return translator;
}

module.exports = { loadAutoModelT5, loadModelM2M };
