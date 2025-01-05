# react-ai-translator

[![npm version](https://badge.fury.io/js/react-ai-translator.svg)](https://badge.fury.io/js/react-ai-translator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A **React** component for **local, secure, on-demand translations** powered by the **[Xenova/nllb-200-distilled-600M](https://huggingface.co/Xenova/nllb-200-distilled-600M)** model. This package utilizes the **WebGPU** capabilities of the device on which the app runs, ensuring data privacy and enabling you to translate text without sending data to third-party APIs.

> **Note**: This is especially suitable when security is a concern and parts of the data are user-provided, which might not be captured in your `i18n` translation files.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Example](#example)
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
npm install react-ai-translator

```

# Usage

Wrap your application (or a section of it) in the `TranslatorProvider` to initialize the translation model.  
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

