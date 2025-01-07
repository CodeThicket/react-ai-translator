const { fork, spawn } = require("node:child_process");
const {
	Worker,
	isMainThread,
	parentPort,
	workerData,
} = require("node:worker_threads");
const jscodeshift = require("jscodeshift");
const { loadAutoModelT5, loadModelM2M } = require("./load_transformer");
// const  translate_transformer = require(`./translate_transformer`);
const fs = require("node:fs");
const path = require("node:path");
let translateGenPath;
// const translateGenFiles = fs.readdirSync(translateGenPath);
const languages = ["en", "es", "fr", "de", "it", "ja", "ko", "zh"];
let ignoreDirectories = ["node_modules", ".git", ".next", "public", "styles"];
let fileNamesToIgnore = [".config"];
let functionsCallsToIgnore = [
	"require",
	"cva",
	"cn",
	"fetch",
	"FontSans",
	"map",
	"split",
	"join",
	"filter",
	"reduce",
	"concat",
	"includes",
	"indexOf",
	"find",
	"findIndex",
	"some",
	"every",
	"sort",
	"slice",
	"splice",
	"push",
	"pop",
	"shift",
	"unshift",
	"reverse",
	"flat",
	"flatMap",
	"fill",
	"copyWithin",
];
let ignoreAttributes = [
	"href",
	"src",
	"className",
	"style",
	"d",
	"viewBox",
	"fill",
	"xmlns",
	"xmlnsXlink",
	"icon",
];
const allowedDirectories = ["src"];
let allowedExtensions = ["js", "jsx", "ts", "tsx"];
let modelName = "";
const staticText = new Map();
let sourceLang = "eng_Latn";
let targets = [];

const checkSubstringMatch = (strings, targetString) => {
	for (const str of strings) {
		if (targetString.includes(str)) {
			return true;
		}
	}
	return false;
};

const deepSearch = (obj, typeArray) => {
	if (typeof obj === "object" && Array.isArray(obj) === false) {
		for (const key in obj) {
			if (key === "loc") {
				continue;
			}

			const element = obj[key];
			if (typeof element !== "object") {
				// console.log(obj['type'],obj['value'])
				if (obj.type && typeArray.includes(obj.type)) {
					if (obj.value !== undefined && typeof obj.value === "string") {
						staticText.delete(obj.value);
					} else if (obj.type === "TemplateLiteral") {
						obj.quasis.forEach((quasi) => {
							const text = quasi.value.raw.trim();
							if (text) {
								staticText.delete(text, "");
							}
						});
					}
				}
			} else {
				deepSearch(element, typeArray);
			}
		}
	} else if (Array.isArray(obj)) {
		for (const key of obj) {
			if (typeof key === "object") {
				deepSearch(key, typeArray);
			}
		}
	}
};

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const translator = null;
const translate = async (
	languages,
	dir,
	srcLang,
	extensions,
	ignore_directories,
	ignoreFiles,
	ignoreFunctions,
	ignore_attributes,
	modelname,
	initialTargetLangs,
) => {
	translateGenPath = dir;
	modelName = modelname;
	allowedExtensions = extensions;
	ignoreDirectories = ignore_directories;
	fileNamesToIgnore = ignoreFiles;
	functionsCallsToIgnore = ignoreFunctions;
	ignoreAttributes = ignore_attributes;
	sourceLang = srcLang;
	targets = initialTargetLangs;
	traverseDir(dir, transform);
	console.log(
		staticText,
		modelName,
		allowedExtensions,
		ignoreDirectories,
		fileNamesToIgnore,
		functionsCallsToIgnore,
		ignoreAttributes,
		sourceLang,
		translateGenPath,
	);
	saveToFile(staticText, languages);
};

const traverseDir = (dir, callback = transform) => {
	fs.readdirSync(dir).forEach((file) => {
		const filePath = path.join(dir, file);
		if (
			fs.statSync(filePath).isDirectory() &&
			ignoreDirectories.includes(file)
		) {
			return;
		}
		if (fs.statSync(filePath).isDirectory()) {
			traverseDir(filePath, callback);
		} else if (
			allowedExtensions.includes(file.split(".").pop()) &&
			!checkSubstringMatch(fileNamesToIgnore, file)
		) {
			callback(filePath, file.split(".").pop());
			console.log(file);
		}
	});
};

const ignoreStrings = ["\n"];

const transform = (filePath, ext) => {
	let parser = "babel";
	const fileContent = fs.readFileSync(filePath, "utf8");
	if (ext === "tsx") {
		parser = "tsx";
	} else if (ext === "ts") {
		parser = "ts";
	}
	const j = jscodeshift.withParser(parser);
	const ast = j(fileContent);
	const jsxTexts = ast.find(jscodeshift.JSXText);
	const jstStringLiteral = ast.find(jscodeshift.StringLiteral);
	const jstLiteral = ast.find(jscodeshift.Literal);
	const jstTemplateLiteral = ast.find(jscodeshift.TemplateLiteral);
	const JSXExpressionContainer = ast.find(jscodeshift.JSXExpressionContainer);
	const jstJSXAttribute = ast.find(jscodeshift.JSXAttribute);
	const jstCallExpression = ast.find(jscodeshift.CallExpression);
	const jstImportDeclaration = ast.find(jscodeshift.ImportDeclaration);
	jsxTexts.forEach((path) => {
		const text = path.node.value.trim();
		if (text.length > 0 && !ignoreStrings.includes(text)) {
			staticText.set(text, "");
		}
	});
	jstStringLiteral.forEach((path) => {
		const text = path.node.value.trim();
		if (text.length > 0 && !ignoreStrings.includes(text)) {
			staticText.set(text, "");
		}
	});
	jstLiteral.forEach((path) => {
		if (typeof path.node.value !== "string") {
			return;
		}
		const text = path.node.value.trim();
		if (text.length > 0 && !ignoreStrings.includes(text)) {
			staticText.set(text, "");
		}
	});
	jstTemplateLiteral.forEach((path) => {
		path.node.quasis.forEach((quasi) => {
			const text = quasi.value.raw.trim();
			if (text) {
				staticText.set(text, "");
			}
		});
	});
	JSXExpressionContainer.forEach((path) => {
		if (j.StringLiteral.check(path.node.expression)) {
			const text = path.node.expression.value.trim();
			if (text) {
				staticText.set(text, "");
			}
		} else if (j.TemplateLiteral.check(path.node.expression)) {
			path.node.expression.quasis.forEach((quasi) => {
				const text = quasi.value.raw.trim();
				if (text) {
					staticText.set(text, "");
				}
			});
		}
	});
	jstJSXAttribute.forEach((path) => {
		if (ignoreAttributes.includes(path.node.name.name)) {
			deepSearch(path.node, ["StringLiteral", "Literal", "TemplateLiteral"]);
		}
	});
	jstCallExpression.forEach((path) => {
		if (
			functionsCallsToIgnore.includes(path.node.callee.name) ||
			functionsCallsToIgnore.includes(path.node.callee.property?.name)
		) {
			deepSearch(path.node, ["StringLiteral", "Literal", "TemplateLiteral"]);
		}
	});
	jstImportDeclaration.forEach((path) => {
		if (path.node?.source?.value) {
			staticText.delete(path.node.source.value);
		}
	});
};

saveToFile = async (staticText, language) => {
	const resources = {};
	const languageTranslationPromises = [];
	const processes = spawnMultipleProcesses();
	await manageChildProcesses(
		processes,
		staticText,
		language,
		sourceLang,
		resources,
	);
	console.log("saving to file", resources);
	if (
		fs.statSync(path.join(translateGenPath, "public")).isDirectory() === false
	) {
		fs.mkdirSync(path.join(translateGenPath, "public"));
	}
	const filePath = path.join(translateGenPath, "public/translation.json");
	let resourceString = JSON.stringify(resources).split('",').join('",\n');
	resourceString = resourceString.split(":{").join(":{\n");
	resourceString = resourceString.split("},").join("},\n");
	fs.writeFileSync(filePath, resourceString, "utf8");
};

spawnMultipleProcesses = () => {
	// const cpus = require('os').cpus().length + 2;
	const cpus = 2;
	const processes = [];
	for (let i = 0; i < cpus; i++) {
		console.log("spawning child process");
		const workerPath = path.join(__dirname, "translate_transformer.js");
		const child = new Worker(workerPath);
		processes.push(child);
	}
	return processes;
};

manageChildProcesses = async (
	processes,
	staticText,
	languages,
	srcLang,
	resources,
) => {
	const staticTextArray = Array.from(staticText);
	const chunkSize = Math.ceil(staticTextArray.length / processes.length);
	const languageTranslationPromises = [];
	for (let i = 0; i < languages.length; i++) {
		const lang = languages[i];
		const jsonlang = targets[i];
		let exit = false;
		if (i === languages.length - 1) {
			exit = true;
		}

		resources[jsonlang] = await createPromise(
			processes,
			staticTextArray,
			chunkSize,
			lang,
			srcLang,
			resources[lang],
			exit,
		);
	}
};

createPromise = (
	processes,
	staticTextArray,
	chunkSize,
	lang,
	srcLang,
	resource,
	exit,
) => {
	return new Promise((resolve, _reject) => {
		let exitcount = 0;
		for (let i = 0; i < processes.length; i++) {
			const chunk = staticTextArray.slice(i * chunkSize, (i + 1) * chunkSize);
			const child = processes[i];
			child.postMessage({
				chunk,
				lang,
				src_lang: srcLang,
				exit,
				model_name: modelName,
			});
			child.on("message", (message) => {
				resource = { ...resource, ...message };
				console.log(resource);
				exitcount++;
				if (exitcount === processes.length) {
					resolve(resource);
				}
			});
			child.on("exit", () => {});
		}
	});
};

module.exports = { translate };
