const {
	pipeline,
	env,
	AutoModelForSeq2SeqLM,
	AutoTokenizer,
	AutoConfig,
} = require("@huggingface/transformers");
const { loadAutoModelT5, loadModelM2M } = require("./load_transformer");
const { parentPort, isMainThread } = require("node:worker_threads");

const translatePromise = async (key, sourceLang, targetLang) => {
	const translator = await loadModel();
	return new Promise(async (resolve, _reject) => {
		const output = await translator(key, {
			src_lang: sourceLang,
			tgt_lang: targetLang,
		});
		console.log(key, output[0].translation_text);
		resolve(output);
	});
};

const translateTransformerM2m100 = async (
	textMap,
	sourceLang,
	targetLang,
	modelName,
) => {
	console.log("Translating text");
	const translator = await loadModelM2M(modelName);
	const resourceObject = {};
	const promisearray = [];
	console.log(textMap, textMap.length, sourceLang, targetLang);
	for (const [key, value] of textMap) {
		const output = await translator(key, {
			src_lang: sourceLang,
			tgt_lang: targetLang,
		});
		resourceObject[key] = output[0].translation_text;
		console.log(key, output[0].translation_text);
	}

	return Promise.resolve(resourceObject);
};

const translateTransformerGoogle = async (
	textMap,
	_sourceLang = "eng_Latn",
	_targetLang = "fra_Latn",
) => {
	console.log("Translating text");
	const [tokeniser, model] = await loadAutoModelT5();
	const resourceObject = {};
	const promisearray = [];
	console.log(textMap, textMap.length);
	for (const [key, value] of textMap) {
		const inputText = `Translate English to French: ${key}`;
		const inputIds = await tokeniser(inputText, { return_tensors: "pt" });
		const outputs = await model.generate({ ...inputIds });
		const decoded = await tokeniser.decode(outputs[0], {
			skip_special_tokens: true,
		});
		resourceObject[key] = decoded;
		console.log(key, decoded);
	}

	return Promise.resolve(resourceObject);
};

if (isMainThread) {
	throw new Error("This script should only be run as a worker thread");
}

parentPort.on("message", async (message) => {
	console.log("Received message", message);
	const response = await translateTransformerM2m100(
		message.chunk,
		message.src_lang,
		message.lang,
		message.model_name,
	);
	parentPort.postMessage(response);
	if (message.exit) {
		process.exit(0);
	}
});
