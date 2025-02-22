# react-ai-translator

[![npm version](https://badge.fury.io/js/react-ai-translator.svg)](https://badge.fury.io/js/react-ai-translator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

1. This package provides a CLI command (**generate_translations**) to generate a `translations.json` file in your `public` directory, containing translations for your website's displayable content.  It uses AI translation services (configurable via options) to translate your content into specified languages. The models used are downloaded from huggingface and run your in local env.

2. A **React** component for **local, secure, on-demand translations** powered by the **[Xenova/nllb-200-distilled-600M](https://huggingface.co/Xenova/nllb-200-distilled-600M)** model. This package utilizes the **WebGPU** capabilities of the device on which the app runs, ensuring data privacy and enabling you to translate text without sending data to third-party APIs.

> **Note**: This is especially suitable when security is a concern and parts of the data are user-provided, which might not be captured in your `i18n` translation files.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Example](#example)
- [CLI Tool for Static Text Translation](#cli-tool-for-static-text-translation)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Demo

Check out a live demo here: **[https://ai-translation-demo-three.vercel.app/](https://ai-translation-demo-three.vercel.app/)**

The example code used for this demo is available in this repository: **[joelshejar/ai-translation-demo](https://github.com/joelshejar/ai-translation-demo)**

---

## Features

- **Secure & Local**: Utilizes your device’s GPU, keeping all data local.
- **No External API Calls**: Perfect for sensitive data scenarios.
- **Real-Time Translations**: On-demand translations for dynamic user content.
- **Easy Integration**: Simple to install and use within any React project.
- **Extensible**: Future-proof design to swap in different translation models based on your needs.

---

## Installation

Install the package via npm (or yarn):

```bash
npm i @codethicket/react-ai-translator
```

# Usage
## CLI Tool for Static Text Translation

We provide a simple CLI command to automatically collect and translate **all static text** in your application into desired languages. Run the following command from your project root:

```bash
npx generate_translations -t Spanish Dutch

```
This command collects all the static text in your app and translates it into the specified languages (Spanish and Dutch in this example).
Other CLI options (for example, to exclude specific files or directories) can be found in the cli.js file.

``` npx generate_translations -t Spanish Danish ...``` run cli command in project workspace with a list of language options to generate translations.json file in public dir of your project . 
For full list of available options, including how to configure the translation model (e.g., specifying a Hugging Face model or API key) or selecting or excluding directories to parse, or available language options and more please refer to the cli.js file in the repository: https://github.com/joelshejar/ai-translation-demo.
-t is the mandatory option to specify list of target languages.
Options
Here's a list of additional available options for the generate_translations command:

-t, --target_languages <target_languages...>: A list of target languages for translation. See the documentation in https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200 for a list of supported languages and use the exact name in this list for this option eg: -t Spanish .

-d, --directory <directory>: The directory to start generating translations from. Defaults to the current working directory. Example: -d src.

-e, --extensions <extensions...>: File extensions to search for translatable text. Defaults to js, jsx, ts, and tsx. Example: -e js jsx html.

-i, --ignore_directories <ignore_directories...>: Directories to ignore during the search for translatable text. Defaults to node_modules, .git, .next, public, styles, and dist. Example: -i node_modules test .

-s, --source_language <source_language>: The source language to translate from. Defaults to English. Example: -s "en-US". See the documentation for a list of supported source languages.

-f, --ignore_files <ignore_files...>: Files to ignore during the search for translatable text. Defaults to .config. Example: -f config.js.

-m, --ignore_functions <ignore_functions...>: Function names to ignore when searching for translatable text (used to prevent translating code). Defaults to a list of common utility functions. Example: -m require cva.

-a, --ignore_attributes <ignore_attributes...>: HTML attributes to ignore when searching for translatable text. Defaults to a list of common attributes like href, src, etc. Example: -a className style.

-l, --model_name <model_name>: The specific Hugging Face model name to use for translation. Defaults to Xenova/nllb-200-distilled-600M. Other options include (but may not be limited to): Xenova/mbart-large-50-many-to-many-mmt, Xenova/m2m100_418M, and CXDuncan/madlad400-3b-mt-optimized-quantized-onnx. See the documentation for supported models and their language support.

2.Wrap your application (or a section of it) in the `TranslatorProvider` to initialize the translation model.  
Use the `useTranslator` hook or `Translator` component to translate text wherever needed.

Below is a minimal example. For more detailed usage, see the [Example](#example) section.

```jsx
import { useEffect, useRef, useState } from 'react'
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from '@joelshejar/react-ai-translator';

import './App.css'

function App() {

  // Inputs and outputs
  const [input, setInput] = useState('I love walking my dog.');
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn');
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn');
  const [output, setOutput] = useState('');

  const { translate, translatedText, loading, progress, modelLoading } = useTranslation();

  useEffect(()=>{
    translate(input,
      sourceLanguage,
      targetLanguage)
  },[])


  return (
    <div>
      <h1>Transformers.js</h1>
      <h2>ML-powered multilingual translation in React!</h2>

      <div className='container'>
        <div className='language-container'>
          <LanguageSelector type={"Source"} defaultLanguage={"eng_Latn"} onChange={x => setSourceLanguage(x.target.value)} />
          <LanguageSelector type={"Target"} defaultLanguage={"fra_Latn"} onChange={x => setTargetLanguage(x.target.value)} />
        </div>

        <div className='textbox-container'>
          <textarea value={input} rows={3} onChange={e => setInput(e.target.value)}></textarea>
          <div style={{width:'50%'}}>{translatedText}</div>
        </div>
      </div>

      <button disabled={modelLoading||loading} onClick={()=>translate(input,
      sourceLanguage,
      targetLanguage)}>Translate</button>
    </div>
  )
}

export default App

```

# How It Works

- **Local Model**  
  This library makes use of [Xenova/nllb-200-distilled-600M](https://huggingface.co/Xenova/nllb-200-distilled-600M), a distilled version of Meta AI’s *No Language Left Behind* model.

- **WebGPU Execution**  
  By leveraging your device’s GPU, the heavy lifting of translation is done locally, avoiding external calls.

- **Security**  
  No user data leaves your environment, making it ideal for handling private or sensitive content.

---

# Requirements

- **React**: ^16.8.0 or newer (hooks are used).  
- **Node**: ^14 or newer.  
- **WebGPU Support**: Ensure your browser or environment supports the [WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).  
- **Model Size**: The `nllb-200-distilled-600M` model is relatively large; ensure sufficient memory & GPU resources.

---

# Roadmap

Some upcoming goals and improvements we’re exploring:

1. **Static Text Discovery**  
   Automatically scan a repo to find all static texts and consolidate them for easy translation management.

2. **Caching Mechanism**  
   Implement efficient caching for translated texts to minimize repeated computations.

3. **Dynamic Model Selection**  
   Allow usage of different translation models based on user needs (e.g., smaller vs. larger model for specific languages).

4. **Bundle Optimization**  
   Investigate ways to reduce package size and loading times.

5. **Language Detection**  
   Automatic source language detection for more streamlined usage.

---

# Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository.  
2. Create a new branch for your feature or fix.  
3. Commit and push your changes.  (please use pnpm commit)
4. Submit a pull request.

We’ll review your submission and work together to make **react-ai-translator** better.

---

## Acknowledgments

We took the base setup for this starter package from [TimMikeladze/typescript-react-package-starter](https://github.com/TimMikeladze/typescript-react-package-starter).


---
# License

This project is licensed under the [MIT License](./LICENSE).  
Feel free to use, modify, and distribute this library in both commercial and private projects.

