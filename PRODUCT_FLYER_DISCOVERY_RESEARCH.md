# Product-Flyer Discovery Research

## Official cost reference

OpenAI’s current API pricing page lists `gpt-image-2` image-token pricing at **$8.00 per million input image tokens**, **$2.00 per million cached input image tokens**, and **$30.00 per million output image tokens**. Text input is listed at **$5.00 per million input tokens** and **$1.25 per million cached input tokens**. Actual per-flyer cost varies with the uploaded source image, output dimensions, quality, and generation settings. [1]

OpenAI’s official image-generation guide describes the Image API as the suitable route when an application needs to generate or edit a single image from one prompt. ViraSquare’s current real-product flyer flow uses this single-image edit pattern. [2]

## Product implication

ViraSquare should treat a full GPT Image 2 flyer as a **high-value, metered outcome**, not as an automatic result of every content recommendation. The strongest product strategy is to reveal the capability early, explain its value clearly, and generate it only after the owner deliberately chooses a real saved product and requests the flyer.

## Sources

[1] OpenAI, [Pricing](https://developers.openai.com/api/docs/pricing).

[2] OpenAI, [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation).
