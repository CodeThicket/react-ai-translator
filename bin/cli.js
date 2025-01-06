#!/usr/bin/env node

const { translate } = require("../src/translate-gen/translate");
const { LANGUAGES_MAP } = require("../src/translate-gen/language_model_map");
const { Command } = require("commander");
const path = require("node:path");
const program = new Command();
program
	.description("A CLI for generating static translation files")
	.version("0.0.1");
program.option(
	"-t, --target_languages <target_languages...>",
	"Language to generate",
);
program.option(
	"-d, --directory <directory>",
	"Directory to start generating translations from",
);
program.option(
	"-e, --extensions <extensions...>",
	"File extensions to search for",
);
program.option(
	"-i, --ignore_directories <ignore_directories...>",
	"Directories to ignore",
);
program.option(
	"-s, --source_language <source_language>",
	"Source language to translate from",
);
program.option("-f, --ignore_files <ignore_files...>", "Files to ignore");
program.option(
	"-m, --ignore_functions <ignore_functions...>",
	"Functions to ignore",
);
program.option(
	"-a, --ignore_attributes <ignore_attributes...>",
	"Strings to ignore",
);
program.option("-l, --model_name <model_name>", "Specific model name");

program.parse();
const translatetargetLangs = [];
const srcLangs = [];
const languages = program.opts().target_languages;
const dir = program.opts().directory ? program.opts().directory : process.cwd();
const srcLang = program.opts().source_language
	? program.opts().source_language
	: "English";
const extensions = program.opts().extensions
	? program.opts().extensions
	: ["js", "jsx", "ts", "tsx"];
const ignoreDirectories = program.opts().ignore_directories
	? program.opts().ignore_directories
	: ["node_modules", ".git", ".next", "public", "styles", "dist"];
const ignoreFiles = program.opts().ignore_files
	? program.opts().ignore_files
	: [".config"];
const ignoreFunctions = program.opts().ignore_functions
	? program.opts().ignore_functions
	: [
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
const ignoreAttributes = program.opts().ignore_attributes
	? program.opts().ignore_attributes
	: [
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
const modelName = program.opts().model_name
	? program.opts().model_name
	: "Xenova/nllb-200-distilled-600M";
const modelList = [
	"Xenova/nllb-200-distilled-600M",
	"Xenova/mbart-large-50-many-to-many-mmt",
	"Xenova/m2m100_418M",
	"CXDuncan/madlad400-3b-mt-optimized-quantized-onnx",
];
if (languages) {
	checkMap(languages, translatetargetLangs);
	checkMap([srcLang], srcLangs);
	console.log("Generating language translation file", modelName);
	translate(
		translatetargetLangs,
		dir,
		srcLangs[0],
		extensions,
		ignoreDirectories,
		ignoreFiles,
		ignoreFunctions,
		ignoreAttributes,
		modelName,
		languages,
	);
} else {
	console.error("Please specify a language");
	process.exit(1);
}

function checkMap(input, langsArray) {
	input.forEach((element) => {
		if (!LANGUAGES_MAP[element]) {
			console.error("Please specify a valid language as per documentation");
			console.error(`${element} does not match`);
			process.exit(1);
		} else if (modelList.includes(modelName)) {
			const supportingmodels = [];
			let noissue = true;
			LANGUAGES_MAP[element].forEach((model) => {
				if (model[modelName] !== undefined && model[modelName] === "") {
					console.error(`This model does not support this language ${element}`);
					noissue = false;
				} else if (model[modelName] !== undefined && model[modelName] !== "") {
					langsArray.push(model[modelName]);
				} else if (Object.values(model)[0] !== "") {
					supportingmodels.push(Object.keys(model)[0]);
				}
			});
			if (!noissue) {
				const models = supportingmodels.join(",");
				console.error(`These models ${models} support this language `);
				process.exit(1);
			}
		} else {
			console.error("Please specify a valid model name as per documentation");
			console.error(`${modelName} does not match`);
			process.exit(1);
		}
	});
}
