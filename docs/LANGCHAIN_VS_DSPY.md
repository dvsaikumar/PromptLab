# LangChain vs. DSPy: Implementation Guide

This guide explains the architectural differences between LangChain and DSPy with practical Python code examples.

---

## 1. LangChain: The "Assembly Line" Approach

**Philosophy:** Explicitly define every step of the process. You are the architect building a pipeline (Chain). You write the `PromptTemplate`, choose the `LLM`, and formatting tools.

### Code Example: Joke Generator

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

# 1. Define the "Worker" (LLM)
model = ChatOpenAI(model="gpt-4")

# 2. Define the "Instuctions" (Prompt Template)
# You manually craft the prompt string.
prompt = ChatPromptTemplate.from_template(
    "Tell me a short, funny joke about {topic}."
)

# 3. Define the "Packaging" (Output Parser)
parser = StrOutputParser()

# 4. Build the Chain (The Assembly Line)
chain = prompt | model | parser

# 5. Run it
result = chain.invoke({"topic": "Ice Cream"})
print(result)
# Output: "Why did the ice cream truck break down? Because there was a rocky road!"
```

**Key Takeaway:** You control *exactly* what gets sent to the LLM. If the output is bad, *you* rewrite the prompt manually.

---

## 2. DSPy: The "Compiler" Approach

**Philosophy:** Prompts are just weights/parameters. You define the **Signature** (Input/Output Types) and provide **Examples**. DSPy's optimizer ("Teleprompter") figures out the best prompt for you.

### Code Example: Joke Generator

```python
import dspy

# 1. Connect to LLM
turbo = dspy.OpenAI(model='gpt-3.5-turbo')
dspy.settings.configure(lm=turbo)

# 2. Define the "Logic" (Signature)
# Instead of writing a prompt text, you define inputs/outputs.
class GenerateJoke(dspy.Signature):
    """Generates a short, funny joke about a topic."""
    topic = dspy.InputField(desc="The subject of the joke")
    joke = dspy.OutputField(desc="A witty one-liner response")

# 3. Define the "Module" (Think Layer in Neural Net)
# ChainOfThought adds reasoning steps automatically.
joke_module = dspy.ChainOfThought(GenerateJoke)

# 4. (Optional) Optimize it!
# Providing examples allows DSPy to "compile" the best prompt.
train_examples = [
    dspy.Example(topic="Cats", joke="Cats do not abide by the laws of nature."),
    dspy.Example(topic="Rust", joke="Rust: 100% safety, 0% errors, 5 hours compiled.")
]

from dspy.teleprompt import BootstrapFewShot

# The Teleprompter learns from your data meant to maximize a metric (e.g., humor score)
teleprompter = BootstrapFewShot(metric=lambda x,y: True) 
compiled_joke_gen = teleprompter.compile(joke_module, trainset=train_examples)

# 5. Run it
result = compiled_joke_gen(topic="Ice Cream")
print(result.joke)
```

**Key Takeaway:** You didn't write the prompt "Tell me a joke...". DSPy generated a complex prompt that likely includes:
*   The Task Description
*   The Few-Shot Examples (selected dynamically)
*   "Chain of Thought" triggers ("Let's think step by step...")

---

## Comparison Table

| Feature | LangChain | DSPy |
| :--- | :--- | :--- |
| **Core Concept** | Chains (Pipeline) | Modules (Layers) |
| **Prompting** | **Manual Template:** You write the text. | **Signatures:** You define Input/Output types. |
| **Optimization** | Manual refinement (Trial & Error). | **Automatic compilation** based on metrics. |
| **Analogy** | Writing C++ code manually. | PyTorch/TensorFlow (Defining architecture, training weights). |
