import { useEffect, useRef, useState } from "react";

interface ProgressItem {
	file: string;
	progress: number;
}

interface WorkerMessage {
	status: string;
	output?: string;
	progress?: number;
	file?: string;
}

const useTranslation = (_workerScript: string) => {
	const worker = useRef<Worker | null>(null);

	// States for managing translation
	const [loading, setLoading] = useState<boolean>(false);
	const [modelLoading, setModelLoading] = useState<boolean>(false);
	const [progress, setProgress] = useState<ProgressItem[]>([]);
	const [translatedText, setTranslatedText] = useState<string>("");
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!worker.current) {
			// Initialize the worker
			worker.current = new Worker(new URL("../worker.js", import.meta.url), {
				type: "module",
			});
		}

		// Handle worker messages
		const onMessage = (e: MessageEvent<WorkerMessage>) => {
			const { status, output, progress: progressValue, file } = e.data;

			switch (status) {
				case "initiate": {
					setLoading(true);
					setModelLoading(true);
					if (file && progressValue !== undefined) {
						setProgress((prev) => [...prev, { file, progress: progressValue }]);
					}
					break;
				}

				case "progress":
					if (file && progressValue !== undefined) {
						setProgress((prev) =>
							prev.map((item) =>
								item.file === file
									? { ...item, progress: progressValue }
									: item,
							),
						);
					}
					break;

				case "done": {
					setModelLoading(false);
					if (file) {
						setProgress((prev) => prev.filter((item) => item.file !== file));
					}
					break;
				}

				case "ready":
					setLoading(false);
					break;

				case "update":
					if (output) {
						setTranslatedText(output);
					}
					break;

				case "complete":
					setLoading(false);
					break;

				default:
					break;
			}
		};

		worker.current.addEventListener("message", onMessage);

		return () => {
			worker.current?.terminate(); // Clean up worker on unmount
			worker.current = null;
		};
	}, []);

	// Function to send translation requests to the worker
	const translate = (text: string, srcLang: string, tgtLang: string): void => {
		if (!worker.current) {
			console.error("Worker is not initialized.");
			return;
		}

		setLoading(true);
		setError(null);
		setTranslatedText(""); // Reset the output

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
