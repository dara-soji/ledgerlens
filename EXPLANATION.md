# LedgerLens — Engineering Notes

LedgerLens is an AI-assisted bank statement processing app built to parse PDF statements asynchronously, extract structured information, and surface the output through a clean full-stack workflow.

This document explains how I approached the project, the main tradeoffs I made, and how I would evolve it further.

## System overview

At a high level, the system works like this:

1. A user uploads one or more PDF bank statements from the frontend.
2. The backend accepts the file and places a processing job onto a Bull queue.
3. A worker consumes the job and runs it through a document-processing pipeline:
   - extract text from the PDF
   - send the content through an LLM-assisted parsing step
   - validate and reconcile the extracted financial data
4. The frontend polls for job status updates and displays progress until processing completes.
5. Once the job finishes, the structured output is rendered in the UI.

This architecture was designed to keep uploads responsive and avoid making users wait on a long-running synchronous request.

## Why I designed it this way

The main product problem here is that statement processing is not instant. PDF parsing and LLM-based extraction both take time, and the experience becomes poor very quickly if the user is left waiting on a blocking API call.

So instead of building a synchronous endpoint that only responds when everything is finished, I treated parsing as a background job. That gives a better experience in a few ways:

- users get immediate feedback after upload
- multiple statements can be processed independently
- failures can be tracked per document
- progress can be surfaced in a more useful way
- the backend is easier to scale around queue workers later

## Backend decisions

### NestJS
I used NestJS for the backend because it gives a strong structure for modular TypeScript services. It is fast to bootstrap, keeps the codebase organized, and makes it easier to reason about boundaries between concerns like parsing, LLM integration, queue processing, and API exposure.

The module-based approach also gives a clean path if the system ever needs to be split into more isolated services later.

### Bull + Redis
I used Bull for queueing and Redis for queue storage because this project benefits from background processing much more than from a purely request-response model.

That allowed me to:
- queue uploads immediately
- process files independently
- expose granular job status
- separate upload handling from parsing/extraction work

### PDF parsing + LLM extraction
The processing flow is deliberately simple:
- parse PDF to text
- send the extracted content into an LLM-guided structuring step
- validate the result against expected balances and transaction totals

I chose this approach because it is pragmatic and gets to a usable result quickly.

## Why I did not build full RAG here

I have worked with retrieval systems before, but I intentionally did not add a full RAG pipeline in this project.

For this use case, the first practical milestone was getting a working document-processing system end to end. Adding retrieval infrastructure too early would have increased complexity without necessarily improving the first usable version.

That said, the current approach has clear limits:
- large PDFs can create prompt-size pressure
- token costs can grow too quickly
- prompt-only extraction is more fragile than a more structured retrieval + chunking strategy

To reduce this risk in the current version, I kept the statement input expectations narrow and validated file sizes.

## LLM abstraction

I added an LLM interface so the project is not tightly coupled to a single provider implementation.

That matters because it gives flexibility to:
- switch providers later
- support multiple providers if needed
- evolve prompt / model logic without pushing provider-specific assumptions through the whole codebase

It is a small design decision, but it makes the system more adaptable.

## Frontend decisions

### Next.js
I used Next.js for the frontend because it gives a strong TypeScript developer experience, clean component organization, and a practical way to build a modern React UI quickly.

### Frontend workflow
The frontend is designed around the operational reality of queued processing:
- users upload via drag-and-drop or file selection
- files enter an upload/processing queue
- the client polls for status changes
- completed documents move into a processed-results view
- failed/completed states are visible instead of hidden

This makes the app feel more like a workflow system than a one-shot file uploader.

### UI structure
The frontend has a few key pieces:
- **FileUploader** for upload interactions
- **File** for queue item state and progress visibility
- **ResultsView** for processed output display
- a dashboard-style layout that separates queued documents from completed ones

That separation is intentional. It makes the system easier to understand at a glance and helps users reason about what is still processing versus what is done.

## What is strong in the current version

I think the strongest parts of this project are:

- the queue-based architecture
- the clear split between frontend and backend concerns
- practical async processing instead of blocking uploads
- usable end-to-end workflow from PDF upload to structured result display
- a product shape that already feels extensible

This is not just an LLM demo. It is closer to a small document-processing product.

## Main limitations

The current version is still limited in a few important ways:

### 1. Extraction reliability
LLM-guided extraction can still be inconsistent, especially if statements vary heavily in layout or contain noisy formatting.

### 2. Large-document handling
The current prompt-based flow is not ideal for much larger or more complex PDFs.

### 3. Result normalization
Extracted data can be improved further with stronger normalization and validation logic before presenting it to users.

### 4. Production hardening
There is still work to do around:
- authentication and authorization
- auditability
- retry handling
- observability
- deployment and infrastructure hardening

## What I would improve next

If I were continuing this project, I would focus on these areas first:

### 1. Better extraction pipeline
- improve document chunking
- add more structured validation
- reduce over-reliance on raw prompt context

### 2. Stronger result normalization
- standardize transaction shapes
- improve reconciliation logic
- surface confidence or validation issues more explicitly

### 3. Better failure and retry handling
- allow clean retries from the UI
- improve error visibility per document
- make failed jobs easier to recover from

### 4. Persistent storage and audit trail
- store processed outputs by user/document
- track upload history
- support re-opening past analyses

### 5. Production-readiness
- containerize the system
- improve deployment workflow
- add monitoring around queue health and parsing failures

## Longer-term direction

If this needed to become a more serious production system, I would move it toward:

- stronger ingestion and preprocessing
- more deterministic extraction for known statement formats
- provider-agnostic document intelligence layer
- persistent job/result storage
- account-level access control
- more robust evaluation of extraction quality

## Final note

The goal of LedgerLens was to build something practical, not just flashy. The value is in designing a workflow that acknowledges the real constraints of PDF parsing and LLM-based extraction, while still producing a clean user experience.

That is the part I would present with confidence: not just that it uses AI, but that it uses asynchronous processing, modular backend design, and a workflow-oriented frontend to make the system usable.