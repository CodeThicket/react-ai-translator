import { useEffect, useRef, useState } from "react";

// Define the possible statuses returned by the worker
type WorkerStatus =
	| "initiate"
	| "progress"
	| "done"
	| "ready"
	| "update"
	| "complete";

// Define the structure of the progress items
interface ProgressItem {
	file?: string;
	progress?: number;
}

// Define the data structure for worker messages
interface WorkerMessageData {
	status: WorkerStatus;
	output?: string;
	progress?: number;
	file?: string;
}

// Hook return type
interface UseTranslationReturn {
	translate: (text: string, srcLang: string, tgtLang: string) => void;
	translatedText: string;
	loading: boolean;
	modelLoading: boolean;
	progress: ProgressItem[];
	error: string | null;
}

const useTranslation = (_workerScript: string): UseTranslationReturn => {
	const worker = useRef<Worker | null>(null);

	// States for managing translation
	const [loading, setLoading] = useState<boolean>(false);
	const [modelLoading, setModelLoading] = useState<boolean>(false);
	const [progress, setProgress] = useState<ProgressItem[]>([]);
	const [translatedText, setTranslatedText] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	console.log("hhhhh");

	useEffect(() => {
		if (!worker.current) {
			// Initialize the worker
			worker.current = new Worker(new URL("./worker.mjs", import.meta.url), {
				type: "module",
			});
		}

		// Handle worker messages
		const onMessage = (e: MessageEvent<WorkerMessageData>) => {
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
					if (output) {
						setTranslatedText(output);
					}
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
			// If you want the worker to be terminated on unmount, uncomment below:
			// worker.current?.terminate();
			// worker.current = null;
		};
	}, []);

	// Function to send translation requests to the worker
	const translate = (text: string, srcLang: string, tgtLang: string) => {
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
