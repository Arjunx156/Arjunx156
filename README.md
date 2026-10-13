<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg">
  <img src="assets/hero-light.svg" width="100%" alt="Arjun, written in particles that reflow through nine scripts, from English to Punjabi.">
</picture>

### I build AI systems and don't call them done until the numbers agree.

I'm Arjun, a B.Tech student in AI and Data Science at Amrita Vishwa Vidyapeetham, Faridabad. I like seeing the whole stack, from a loss curve to a WebSocket frame. Most weeks go to LLM systems and the research that keeps them honest. Every figure below is drawn from a project's real numbers.

[Portfolio](https://portfolio-chi-beryl-27.vercel.app) · [LinkedIn](https://www.linkedin.com/in/arjunkrishnansuresh/) · [Email](mailto:dl.ai.u4aid24107@dl.students.amrita.edu)

<br>

## Systems

LLM software that has to run, stream and stay up.

<table>
<tr>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/voice-dark.svg">
  <img src="assets/voice-light.svg" width="100%" alt="One spoken request hops through nine agents, from speech to text to a ticket, inside a ten-second budget.">
</picture>

**VoiceCare AI**<br>
Speak your problem in your own language and hear the fix back in under ten seconds. Nine LangGraph agents carry it from speech to a ticket, all over one WebSocket, with six hard escalation rules on the way.

<sub>LangGraph · Gemini 2.5 · Bhashini · FastAPI · Next.js · Postgres · Redis</sub><br>
[Live demo](https://frontend-roan-three-65.vercel.app) · [Source](https://github.com/Arjunx156/VoiceCare-AI)

</td>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/fusion-dark.svg">
  <img src="assets/fusion-light.svg" width="100%" alt="A keyword ranking and a vector ranking merge by reciprocal rank fusion, a cross-encoder reorders them, and the top five go to the model.">
</picture>

**Hybrid RAG engine**<br>
Keyword search and vector search vote, then a cross-encoder picks what the model gets to read. Answers stream with page-level citations, and one environment variable swaps OpenAI for a local Ollama model.

<sub>FastAPI · ChromaDB · sentence-transformers · Ollama · Streamlit</sub><br>
[Docs](https://arjunx156.github.io/rag-system/) · [Source](https://github.com/Arjunx156/rag-system)

</td>
</tr>
</table>

## Research

Two co-authored papers, with the failures written down too.

<table>
<tr>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/charge-dark.svg">
  <img src="assets/charge-light.svg" width="100%" alt="Predicted state of charge tracks the true curve, and the Monte Carlo dropout uncertainty band widens while the battery charges.">
</picture>

**Intelligent battery management for IoT nodes**<br>
A four-head attention BiLSTM predicts state of charge on 19,735 readings, split by time so the future never leaks into training. The battery-health heads scored a negative R², and that went into the paper too.

<sub>Published, co-author · TensorFlow · BiLSTM · multi-head attention · Monte Carlo dropout</sub>

</td>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/relief-dark.svg">
  <img src="assets/relief-light.svg" width="100%" alt="Supply flows from a depot to five districts, a route is blocked, and one Dynamic Mode Decomposition eigenvalue leaves the unit circle to flag it.">
</picture>

**Emergency resource allocation for Delhi**<br>
800 units of relief, 910 units of need, five districts. Urgency-weighted proximal gradient beat three other optimisers, and Dynamic Mode Decomposition spots a blocked route on its own, so service bends instead of breaking.

<sub>Research paper, co-author · MATLAB · proximal gradient · ADMM · DMD</sub>

</td>
</tr>
</table>

## Security

Break it first, then fix it properly.

<table>
<tr>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/intercept-dark.svg">
  <img src="assets/intercept-light.svg" width="100%" alt="Mallory swaps both Diffie-Hellman public values and holds two session keys, then a certificate authority signs the keys and her forgery fails.">
</picture>

**Man in the middle on Diffie-Hellman**<br>
Mallory swaps both public values and quietly holds both keys. Every primitive is hand-written, from Miller-Rabin to 512-bit RSA, and then a certificate authority signs the keys and the forgery fails.

<sub>Python · Miller-Rabin · RSA · PKI</sub>

</td>
<td width="50%" valign="top">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/spike-dark.svg">
  <img src="assets/spike-light.svg" width="100%" alt="Throughput runs past a rolling three-sigma band, a 45.09 MB/s spike breaks out, and the protocol moves from monitor to violation.">
</picture>

**Adaptive Bandwidth Monitoring Protocol**<br>
A big download and data exfiltration look the same to a fixed threshold. ABMP learns normal from a rolling 20-second window and flags anything three standard deviations out, as a real three-state protocol.

<sub>Python · psutil · NumPy · WebSockets · Streamlit</sub>

</td>
</tr>
</table>

## Also built

**[Natural language to app schema compiler](https://github.com/Arjunx156/nl-app-compiler)**. Plain English in, validated UI, API, database and auth schemas out. Five Gemini stages pass 90% of a 20-test harness, and the repair engine reruns only the stage that failed. [Live](https://nl-app-compiler.vercel.app)

**[Local LLM benchmarking harness](https://github.com/Arjunx156/Local-LLM-Benchmarking-Assistant)**. Six open-weight models, forty tasks and three graders (exact match, LLM as judge, sandboxed code execution), all offline, with latency and throughput logged per model.

**[Kachra se Kamai](https://github.com/Arjunx156/kachra-se-kamai)**. Snap your dustbin and Amazon Nova prices your recyclables, then bundles pickups with your neighbours' for local waste pickers. Built on AWS SAM, Bedrock and Strands Agents.

**[Task manager agent](https://github.com/Arjunx156/task-manager-agent)**. Scheduling, notes and day planning split across Google ADK sub-agents, running as a managed service on Cloud Run.

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hello-dark.svg">
  <img src="assets/hello-light.svg" width="100%" alt="Hello, in particles that reflow through nine scripts, from English to Punjabi.">
</picture>

I'm looking for an internship in AI research, model evaluation or security. If your team cares whether the model is actually right, [write to me](mailto:dl.ai.u4aid24107@dl.students.amrita.edu) or find me on [LinkedIn](https://www.linkedin.com/in/arjunkrishnansuresh/).

<sub>Engineered by Arjun Krishnan Suresh. Every SVG here is generated by [`tools/build.ts`](tools/build.ts) from the same fonts and numbers as the portfolio.</sub>
