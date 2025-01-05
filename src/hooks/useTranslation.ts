import { useEffect, useRef, useState } from "react";

type WorkerStatus =
	| "initiate"
	| "progress"
	| "done"
	| "ready"
	| "update"
	| "complete";

interface ProgressItem {
	file?: string;
	progress?: number;
}

interface WorkerMessageData {
	status: WorkerStatus;
	output?: string;
	progress?: number;
	file?: string;
}

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

	const [loading, setLoading] = useState<boolean>(false);
	const [modelLoading, setModelLoading] = useState<boolean>(false);
	const [progress, setProgress] = useState<ProgressItem[]>([]);
	const [translatedText, setTranslatedText] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!worker.current) {
			worker.current = new Worker(new URL("./worker.mjs", import.meta.url), {
				type: "module",
			});
		}

		const onMessage = (e: MessageEvent<WorkerMessageData>) => {
			const { status, output, progress: progressValue, file } = e.data;

			switch (status) {
				case "initiate": {
					setLoading(true);
					setModelLoading(true);
					setProgress((prev) => [...prev, { file, progress: progressValue }]);
					break;
				}

				case "progress": {
					setProgress((prev) =>
						prev.map((item) =>
							item.file === file ? { ...item, progress: progressValue } : item,
						),
					);
					break;
				}

				case "done": {
					setModelLoading(false);
					setProgress((prev) => prev.filter((item) => item.file !== file));
					break;
				}

				case "ready": {
					setLoading(false);
					break;
				}

				case "update": {
					if (output) {
						setTranslatedText(output);
					}
					break;
				}

				case "complete": {
					setLoading(false);
					break;
				}
			}
		};

		worker.current.addEventListener("message", onMessage);

		return () => {
			// worker.current?.removeEventListener("message", onMessage)
			// If you want the worker to be terminated on unmount, uncomment below:
			// worker.current?.terminate();
			// worker.current = null;
		};
	}, []);

	const translate = (text: string, srcLang: string, tgtLang: string) => {
		if (!worker.current) {
			console.error("Worker is not initialized.");
			return;
		}

		setLoading(true);
		setError(null);
		setTranslatedText("");

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
