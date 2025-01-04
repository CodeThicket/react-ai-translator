import { useEffect, useRef, useState } from "react";

const useTranslation = (_workerScript) => {
	const worker = useRef(null);

	// States for managing translation
	const [loading, setLoading] = useState(false);
	const [modelLoading, setModelLoading] = useState(false);
	const [progress, setProgress] = useState([]);
	const [translatedText, setTranslatedText] = useState("");
	const [error, setError] = useState(null);

	console.log("hhhhh");

	useEffect(() => {
		if (!worker.current) {
			// Initialize the worker
			worker.current = new Worker(new URL("./worker.mjs", import.meta.url), {
				type: "module",
			});
		}

		// Handle worker messages
		const onMessage = (e) => {
			const { status, output, progress: progressValue, file } = e.data;

			console.log(status, "status");

			switch (status) {
				case "initiate": {
					console.log("initiate");
					setLoading(true);
					setModelLoading(true);
					setProgress((prev) => [...prev, { file, progress: progressValue }]);
					break;
				}

				case "progress": {
					console.log("progress");
					setProgress((prev) =>
						prev.map((item) =>
							item.file === file ? { ...item, progress: progressValue } : item,
						),
					);
					break;
				}

				case "done": {
					console.log("done");
					setModelLoading(false);
					setProgress((prev) => prev.filter((item) => item.file !== file));
					break;
				}

				case "ready": {
					console.log("ready");
					setLoading(false);
					break;
				}

				case "update": {
					console.log("update");
					console.log(output, "output");
					// Append partial translations
					setTranslatedText(output);
					break;
				}

				case "complete": {
					console.log("complete");
					setLoading(false);
					break;
				}
			}
		};

		worker.current.addEventListener("message", onMessage);

		return () => {
			// worker.current.terminate(); // Clean up worker on unmount
			// worker.current = null;
		};
	}, []);

	// Function to send translation requests to the worker
	const translate = (text, srcLang, tgtLang) => {
		console.log("kkkk");
		if (!worker.current) {
			console.error("Worker is not initialized.");
			return;
		}

		setLoading(true);
		setError(null);
		setTranslatedText(""); // Reset the output

		console.log("lllll", text, srcLang, tgtLang);

		worker.current.postMessage({
			text,
			src_lang: srcLang,
			tgt_lang: tgtLang,
		});
	};

	return {
		translate,
		translatedText,
		loading,
		modelLoading,
		progress,
		error,
	};
};

export default useTranslation;
